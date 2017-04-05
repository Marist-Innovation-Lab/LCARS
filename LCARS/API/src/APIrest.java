import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import fi.iki.elonen.NanoHTTPD;
import fi.iki.elonen.ServerRunner;

import java.io.*;
import java.sql.*;
import java.net.*;
import java.util.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * The LCARS API.
 *
 * @author Alan and the Marist NSF-stars
 */
public class APIrest extends NanoHTTPD {

   public static final String apiVersion = "0.07";
   public static final String apiName    = "LCARS API version " + apiVersion;
   
   public static final String databaseRemoteURL = "//10.10.7.84:5432";
   public static final String databaseLocalURL  = "//localhost:5432";
   public static String databaseURL = databaseLocalURL; // Either databaseRemoteURL or databaseLocalURL, default to databaseLocalURL.
   public static String databaseName = "lcars";
   public static String databaseUser     = "lcars";
   public static String databasePassword = "alpacaalpaca";          // TODO: Obfuscate these somehow.

   public static final String messageKey = "message";  // This is the key in our JSON key-value objects for messages.

   public APIrest() {
      super(8081);  // call the NanoHTTPD constructor.
      try {
         // Set up the (relational) database connection, which can be used anywhere in our API.
         // Begin by determining whether or not we're running on an AWS server or locally somewhere else. Assume local.
         // databaseURL = databaseLocalURL;
         databaseURL = databaseRemoteURL;
         try {
            // Ask the OS to resolve our host name and IP address.
            String host = InetAddress.getLocalHost().toString();
            System.out.println("Host: " + host);
            if (host.contains("ec2.internal")) {
               databaseURL = databaseRemoteURL;
            }
         } catch (UnknownHostException ex) {
            // No resolution, so we must be local.
            System.out.println("Host unknown, can not be resolved.");
         }

         try {
            // Load the PostgreSQL JDBC Driver class. (It is hopefully in a JAR referenced in the classpath,
            // but check /Library/Java/Extensions because JARs there might take precedence over those specified in the classpath.)
            // The Driver is automatically registered with DriverManager for our later use.
            Class.forName("org.postgresql.Driver");
            // Construct the URL for access to our database.
            String url = "jdbc:postgresql:" + databaseURL + "/" + databaseName ;
            // Set the connection properties.
            Properties props = new Properties();
            props.setProperty("user", databaseUser);       
            props.setProperty("password", databasePassword);
            props.setProperty("ApplicationName", apiName);
            // Ask the DriverManager to lookup the Driver we loaded earlier
            // and make us a connection with the properties we just defined.
            Connection conn = DriverManager.getConnection(url, props);
            // Note this connection in our (protected) field for use elsewhere in this class.
            this.databaseConnection = conn;
            // Finally, print some debug data to the console. This will help us be sure
            // that local and cloud versions are using consistent versions of the driver.
            System.out.println("JDBC driver " + DriverManager.getDriver(url).getMajorVersion() + "." +
                                DriverManager.getDriver(url).getMinorVersion());
         } catch (SQLException e) {
            System.out.println("Driver loaded, but unable to connect to: " + databaseURL);
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            if (this.databaseConnection != null) {
               this.databaseConnection.close();
            }
         } catch (Exception e) {
            System.err.println(e.toString());
            if (this.databaseConnection != null) {
               this.databaseConnection.close();
            }
         }
      } catch (Exception ex) {
         System.out.println("Error in APIrest constructor: " + ex.getCause());
         writeLog("Error in APIrest constructor: " + ex.getMessage());
      }
   }

   public static void main(String[] args) throws Exception {
      System.out.println("Welcome to the LCARS REST API server version " + apiVersion );
      Runtime rt = Runtime.getRuntime();
      System.out.print(" JVM says: Processors:" + rt.availableProcessors());
      System.out.print("  Total memory:" + java.text.NumberFormat.getNumberInstance(java.util.Locale.US).format(rt.totalMemory()));
      System.out.print("  Free memory:" + java.text.NumberFormat.getNumberInstance(java.util.Locale.US).format(rt.freeMemory()));
      System.out.println("  Used memory:" + java.text.NumberFormat.getNumberInstance(java.util.Locale.US).format(rt.totalMemory() - rt.freeMemory()));
      // Launch the server.
      ServerRunner.run(APIrest.class);
   }

   @Override
   public Response serve(IHTTPSession session) {
       
      Map<String, String> headers = session.getHeaders();   // We'll likely need this later.
      
      // Note what method (GET, POST, PUT, DELETE, OPTIONS) got us here.
      // We'll use this to short-circuit the rather lengthy evaluation coming up.
      boolean methodIsGET     = false;
      boolean methodIsPOST    = false;
      boolean methodIsPUT     = false;
      boolean methodIsDELETE  = false;
      boolean methodIsOPTIONS = false;
      Method method = session.getMethod();
      String reqBody = "";
      JsonObject reqJSON = new JsonObject();
      if (Method.GET.equals(method)) {
         methodIsGET = true;
      } else if (Method.POST.equals(method)) {
         methodIsPOST = true;
         // Read JSON string from request body and parse it 
         Integer contentLength = Integer.parseInt(headers.get("content-length"));
         byte[] buf = new byte[contentLength];
         try {
             session.getInputStream().read(buf, 0, contentLength);
             reqBody = new String(buf);
             reqJSON = new JsonParser().parse(reqBody).getAsJsonObject();
         } catch (Exception e) {
             // Do something if fails
         }
      } else if (Method.PUT.equals(method)) {
         methodIsPUT = true;
         // Read JSON string from request body and parse it 
         Integer contentLength = Integer.parseInt(headers.get("content-length"));
         byte[] buf = new byte[contentLength];
         try {
             session.getInputStream().read(buf, 0, contentLength);
             reqBody = new String(buf);
             reqJSON = new JsonParser().parse(reqBody).getAsJsonObject();
         } catch (Exception e) {
             // Do something if fails
         }
      } else if (Method.DELETE.equals(method)) {
         methodIsDELETE = true;
      } else if (Method.OPTIONS.equals(method)) {
         methodIsOPTIONS = true;
      }

      // Start building the response.
      NanoHTTPD.Response response = null;
      StringBuilder sb = new StringBuilder();

      // We'll begin by parsing the command into one or more pieces.
      String wholeCommand = String.valueOf(session.getUri()); //.toLowerCase()

      System.out.println("API received command: " + wholeCommand);    // TODO: Is this for debugging or a real feature?

      String[] commands = null;
      String command = "";
      if (wholeCommand.equals("") || wholeCommand.equals("/")) {
         // All we got was / , so alias that as the "home" command.
         command = "home";
      } else {
         commands = wholeCommand.split("/");
         command = commands[1];  // [0] == "" because the first char is "/" and we're splitting on that.
      }

      // At this point we have a command and its parameters (the actions, if any) in commands[].

      //
      // icons - GET only - These seem to happen a lot, so let's keep them up here.
      //
      if (methodIsGET && command.startsWith("apple-touch-icon")) {
         sb.append("apple-touch-icon.");
         response = new NanoHTTPD.Response(sb.toString());

      } else if (methodIsGET && command.equals("favicon.ico")) {
         sb.append("favicon");
         response = new NanoHTTPD.Response(sb.toString());

      //
      // OPTIONS - We respond with the same thing regardless of the command so only handle it once.
      //
      } else if (methodIsOPTIONS) {
         // Explicitly allow the HTTP verbs GET,POST,PUT,DELETE,OPTIONS.
         // This (hopefully) avoids cross-site scripting security violations in the browser.
         sb.append(makeJSON(messageKey, "200 OK\nAllow: GET,POST,PUT,DELETE,OPTIONS"));
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // home - GET only - Display the home/help/test screen.
      //
      } else if (methodIsGET && command.equals("home")) {
         sb = responseGetHome(session, "Home");
         response = new NanoHTTPD.Response(sb.toString());
         // DO NOT addApiResponseHeaders() because we want the results as regular old HTML here.

      //
      // version / ver - GET only
      //
      } else if (methodIsGET &&  (command.equals("version") || command.equals("ver"))) {
         sb = responseGetVersion();
         // Build the response from the StringBuilder content...
         response = new NanoHTTPD.Response(sb.toString());
         // ... and add the special headers. This pattern repeats throughout this code. (These comments do not.)
         addApiResponseHeaders(response);

      //
      // date - GET only
      //
      } else if (methodIsGET && command.equals("date")) {
         sb = responseGetDate();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // time - GET only
      //
      } else if (methodIsGET && command.equals("time")) {
         sb = responseGetTime();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // datetime - GET only
      //
      } else if (methodIsGET && command.equals("datetime")) {
         sb = responseGetDateTime();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // hpinfo - GET only - Gets infomation about active honeypots including hostname and most recent attack time
      //
      } else if (methodIsGET && command.equals("hpinfo")) {
         sb = responseGetHPInfo();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // blackridgelogs - GET only - Gets infomation about BlackRidge gateways including hostname and most recent logging time
      //
      } else if (methodIsGET && command.equals("blackridgelogs")) {
         sb = responseGetBlackRidgeInfo();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // experimentallogs - GET only - Gets information about experimental logs
      //
      } else if (methodIsGET && command.equals("experimentallogs")) {
         sb = responseGetExperimentalLogs();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // logentries - GET only - Gets the number of log entries recorded today
      //
      } else if (methodIsGET && command.equals("logentries")) {
         sb = responseGetLogEntriesCount();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // attacks - GET only - Gets the number of attacks recorded today
      //
      } else if (methodIsGET && command.equals("attacks")) {
         sb = responseGetAttacksCount();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // countrydata - GET only - Gets the number of attacks broken up by country
      //
      } else if (methodIsGET && command.equals("countrydata")) {
         sb = responseGetCountryData();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // osversion - GET only - Gets the OS version information
      //
      } else if (methodIsGET && command.equals("osversion")) {
         sb = responseGetOsVersion();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      
      //
      // interfacedetails - GET only - Gets information about LCARS system interfaces
      //
      } else if (methodIsGET && command.equals("interfacedetails")) {
         sb = responseGetInterfaceDetails();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      
      //
      // iptables - GET only - Gets information about LCARS system iptables
      //
      } else if (methodIsGET && command.equals("iptables")) {
         sb = responseGetIptables();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
         
      //
      // systeminfo - GET only - Gets information about LCARS system
      //
      } else if (methodIsGET && command.equals("systeminfo")) {
         sb = responseGetSystemInfo();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // models - GET only - Gets list of neural network models LCARS knows about (stored in model directory, ending in .yaml)
      //
      } else if (methodIsGET && command.equals("models")) {
         sb = responseGetModels();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      
      //
      // tests - GET only - Gets list of neural network test matrices that LCARS knows about (inside tests directory)
      //
      } else if (methodIsGET && command.equals("tests")) {
         sb = responseGetTests();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // lcarslog - GET/PUT - Get all log entries from the LCARS log / Create new LCARS log entry
      //
      } else if (methodIsGET && command.equals("lcarslog")) {
         sb = responseGetLcarsLog();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsPUT && command.equals("lcarslog")) {
         sb = responsePutLcarsLog(reqJSON);
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // savelog - POST only - Save a honeypot or BlackRidge log as an experimental log
      //
      } else if (methodIsPOST && command.equals("savelog")) {
         sb = responsePostExperimentalLog(reqJSON);
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // predict - POST only - predict outcome using given model for given matrix 
      //
      } else if (methodIsPOST && command.equals("predict")) {
         sb = responsePostPrediction(reqJSON);
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // config - POST only - get the configuration options for a model from ML.ini
      //
      } else if (methodIsPOST && command.equals("config")) {
         sb = responsePostConfig(reqJSON);
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);

      //
      // profiles - GET/PUT/DELETE - Get everything in Profiles table / Insert new profile / Delete all profiles
      //    Example PUT: 
      //        URL - localhost:8081/profiles
      //        HTTP PUT Body (JSON) - {"name" : "New Profile", "details" : "Profile details"}
      // profiles/<pid> - GET/POST/DELETE - Get a single profile / Update existing profile / Delete existing profile
      //    Example POST: 
      //        URL - localhost:8081/profiles/1
      //        HTTP POST Body (JSON) - {"name" : "Updated Name", "details" : "Updated details"}
      //
      } else if (methodIsGET && command.equals("profiles")) {
         if(commands.length > 2) {
             sb = responseGetProfile(Integer.parseInt(commands[2]));
         } else {
             sb = responseGetProfiles();
         }
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsPOST && command.equals("profiles")) {
          if(commands.length > 2) {
              sb = responseUpdateProfile(Integer.parseInt(commands[2]), reqJSON);
          } else {
              sb.append(makeJSON(messageKey, "Please specify a pid.")); 
          }
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
      } else if (methodIsPUT && command.equals("profiles")) {
          sb = responsePutProfile(reqJSON);
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
      } else if (methodIsDELETE && command.equals("profiles")) {
          if(commands.length > 2) {
              sb = responseDeleteProfile(Integer.parseInt(commands[2]));
          } else {
              sb = responseDeleteProfiles();
          }
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
          
      //
      // responserecipes - GET/PUT/DELETE - Get everything in ResponseRecipes table / Insert new response recipe / Delete all response recipes
      //    Example PUT: 
      //        URL - localhost:8081/responserecipes
      //        HTTP PUT Body (JSON) - {"name" : "New Recipe"}
      //    Example DELETE:
      //        URL - localhost:8081/responserecipes
      //
      // responserecipes/<rrid> - GET/POST/DELETE - Get all details of a particular recipe / Update existing response recipe / Delete a specific response recipe
      //    Example POST: 
      //        URL - localhost:8081/responserecipes/1
      //        HTTP PUT Body (JSON) - {"name" : "Updated Name"}
      //    Example DELETE:
      //        URL - localhost:8081/responserecipes/1
      } else if (methodIsGET && command.equals("responserecipes")) {
         if(commands.length > 2) {
            sb = responseGetResponseRecipe(Integer.parseInt(commands[2]));
         } else {
            sb = responseGetResponseRecipes();            
         }
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsPOST && command.equals("responserecipes")) {
          if(commands.length > 2) {
              sb = responseUpdateResponseRecipe(Integer.parseInt(commands[2]), reqJSON);
          } else {
              sb.append(makeJSON(messageKey, "Please specify a pid.")); 
          }
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
      } else if (methodIsPUT && command.equals("responserecipes")) {
          sb = responsePutResponseRecipe(reqJSON);
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
      } else if(methodIsDELETE && command.equals("responserecipes")){
          if(commands.length > 2){
              sb = responseDeleteResponseRecipe(Integer.parseInt(commands[2]));
          } else {
              sb = responseDeleteResponseRecipes();
          }
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
      //
      // responsedetails - GET / DELETE - Get everything in ResponseDetails table / Delete everything in ResponseDetails table
      //  
      // responsedetails - PUT - Add a response detail to an existing recipe
      //     Example PUT:
      //         URL - localhost:8081/responsedetails
      //         HTTP PUT Body (JSON) - {"rrid" : "1", "ruleorder" : "2", "target" : "drop", "chain" : "input", 
      //                                  "protocol" : "tcp", "source" : "1.2.3.4", "destination" : "2.3.4.5"}
      // responsedetails/<rdid> - POST / DELETE - Update an existing response detail / Delete an existing response detail
      //     Example POST:
      //         URL - localhost:8081/responsedetails/1
      //         HTTP POST Body (JSON) - {"rrid" : "1", "ruleorder" : "2", "target" : "drop", "chain" : "input", 
      //                                  "protocol" : "tcp", "source" : "1.2.3.4", "destination" : "2.3.4.5"}
      //
      } else if (methodIsGET && command.equals("responsedetails")) {
         sb = responseGetResponseDetails();
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsPUT && command.equals("responsedetails")) {
         sb = responsePutResponseDetail(reqJSON);
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsPOST && command.equals("responsedetails")) {
         if(commands.length > 2) {
              sb = responseUpdateResponseDetail(Integer.parseInt(commands[2]), reqJSON);
         } else {
              sb.append(makeJSON(messageKey, "Please specify RDID.")); 
          }
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsDELETE && command.equals("responsedetails")) {
          if(commands.length > 2) {
              sb = responseDeleteResponseDetail(Integer.parseInt(commands[2]));
          } else {
              sb.append(makeJSON(messageKey, "Please specify RDID."));
          }
          response = new NanoHTTPD.Response(sb.toString());
          addApiResponseHeaders(response);
      //
      // orchestration - GET/PUT/DELETE - Get orchestration for every profile / Insert new orchestration record / Delete all records
      //    Example PUT:
      //        URL - localhost:8081/orchestration
      //        HTTP PUT Body (JSON) - {"pid" : "1", "rrid" : "1"}
      // orchestration/<pid> - GET/DELETE  - Get orchestration for single profile / Delete all orchestration for a single profile
      // orchestration/<pid>/<rrid> - DELETE - Delete single orchestration record
      //
      } else if (methodIsGET && command.equals("orchestration")) {
         if(commands.length > 2) {
             sb = responseGetSingleOrchestration(Integer.parseInt(commands[2]));
         } else {
             sb = responseGetOrchestration();
         }
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsPUT && command.equals("orchestration")) {
         sb = responsePutOrchestration(reqJSON);
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      } else if (methodIsDELETE && command.equals("orchestration")) {
         if(commands.length > 3) {
             sb = responseDeleteSingleOrchestration(Integer.parseInt(commands[2]), Integer.parseInt(commands[3]));
         } else if (commands.length == 3) {
             sb = responseDeleteOrchestrationProfile(Integer.parseInt(commands[2]));
         } else {
             sb = responseDeleteOrchestration();
         }
         response = new NanoHTTPD.Response(sb.toString());
         addApiResponseHeaders(response);
      //
      // anything not matching above - GET and others
      // 
      } else {
         // If someone is trying to run a wrong command, log their IP address and the current date and time.
         // Then enter it into the database.
         try {
            String IPList = headers.get("remote-addr");
            DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSSS");
            java.util.Date date = new java.util.Date();
            String sqlCommand = "INSERT INTO iplogs(ip_list, date) VALUES ('" + IPList + "', '" + dateFormat.format(date) +",)";
            dbCommand(sqlCommand);
         } catch (Exception ex) {
            // TODO Can we safely ignore this? I don't want to break the logic below.
         }

         // Any unknown command (regardless of the above) results in the home/debug screen (for GET) 
         // or an error response (for anything else).
         if (methodIsGET) {
            // It was a GET, so send back the home/debug page with the unknown command in there.
            sb = responseGetHome(session, "Unknown command: " + method.toString() + " " + command);
         } else  {
            // Not being a GET, we don't want to respond with a web page,
            // so we'll respond with an JSON-encoded error message.
            String msgValue = "Error: " + command + " is an invalid " + session.getMethod() + " command.";
            sb.append(makeJSON(messageKey, msgValue ));
         }
         writeLog("Unknown command: " + method.toString() + " " + command);
         response = new NanoHTTPD.Response(sb.toString());
      } // end of massive IF-ELSE block.
      
      return response;
   }
   

   /* -----------------
      --- Protected ---
      -----------------  */
   protected Connection databaseConnection;		 // The (relational) database connection instance.


   /* ---------------
      --- Private ---
      ---------------  */

   //
   // Response routines
   //

   private StringBuilder responseGetHome(IHTTPSession session, String heading) {
      StringBuilder sb = new StringBuilder();
      // Header
      sb = createHeader(heading);

      // HTTP method
      sb.append("<p><strong>Method</strong> = ").append(String.valueOf(session.getMethod())).append("</p>");

      // URI / Command
      sb.append("<p><strong>URI / API command</strong> = ").append(String.valueOf(session.getUri())).append("</p>");

      // API help
      sb.append("<h3>API help</h3><pre>" +   APIHelp() + "</pre>");

      // API tester for GET and POST commands.
      sb.append("<h3>API Testers</h3>");
      sb.append("<input type='button' value='GET'  style='width:64px;' onclick='sendIt(\"GET\");'>&nbsp;/<input type='text' id='txt2get' size='48' onkeydown='javascript:if(event.keyCode === 13) sendIt(\"GET\");'>");
      sb.append("<br>");
      sb.append("<input type='button' value='PUT' style='width:64px;' onclick='sendIt(\"PUT\");'>&nbsp;/<input type='text' id='txt2put' size='48' onkeydown='javascript:if(event.keyCode === 13) sendIt(\"PUT\");'>");
      sb.append("<br>");
      sb.append("<input type='button' value='POST' style='width:64px;' onclick='sendIt(\"POST\");'>&nbsp;/<input type='text' id='txt2post' size='48' onkeydown='javascript:if(event.keyCode === 13) sendIt(\"POST\");'>");
      sb.append("<br>");
      sb.append("<input type='button' value='DELETE' style='width:64px;' onclick='sendIt(\"DELETE\");'>&nbsp;/<input type='text' id='txt2delete' size='48' onkeydown='javascript:if(event.keyCode === 13) sendIt(\"DELETE\");'>");
      sb.append("<br>");
      sb.append("<label>Request Body: <br><textarea id='requestBody' rows='2' cols='64'></textarea></label>");
      sb.append("<br>");
      sb.append("<label>Response: <br><textarea id='taDisplay' rows='2' cols='64'></textarea>");
      // JavaScript functions getIt(), postIt() and display() are defined in the header.

      // HTTP Headers
      sb.append("<h3>HTTP Headers</h3><blockquote>").append(toString(session.getHeaders())).append("</blockquote>");

      // Parameters
      sb.append("<h3>Parameters</h3><blockquote>").append(toString(session.getParms())).append("</blockquote>");
      Map<String, List<String>> decodedQueryParameters = decodeParameters(session.getQueryParameterString());
      sb.append("<h3>Parameters (multi values?)</h3><blockquote>").append(toString(decodedQueryParameters)).append("</blockquote>");

      // Files
      try {
         Map<String, String> files = new HashMap<String, String>();
         session.parseBody(files);
         sb.append("<h3>Files</h3><blockquote>").
         append(toString(files)).append("</blockquote>");
      } catch (Exception e) {
         e.printStackTrace();
      }

      // Footer
      sb.append(createFooter());
      return sb;
   }

   /**
    * List the API commands.
    * @return API help sting
    */
   private String APIHelp() {
      return "API commands: GET [action], PUT [action], POST [action], DELETE [action]\n\n" +
             "+-- GET  /ver[sion]                          - API version\n"  +
             "+-- GET  /date                               - current date\n" +             
             "+-- GET  /time                               - current time\n" +
             "+-- GET  /datetime                           - current date and time\n" +
             "+-- GET  /hpinfo                             - information about all active honeypots\n" +
             "+-- GET  /blackridgelogs                     - information about all BlackRidge gateways\n" +
             "+-- GET  /experimentallogs                   - information about all experimental logs\n" +
             "+-- GET  /logentries                         - number of recorded log entries today\n" +
             "+-- GET  /attacks                            - number of recorded attacks today\n" +
             "+-- GET  /countrydata                        - number of attack separated by country of origination\n" +
             "+-- GET  /osversion                          - version info about LCARS server operating system\n" +
             "+-- GET  /interfacedetails                   - info about LCARS server interfaces\n" +
             "+-- GET  /iptables                           - info about LCARS server iptables firewall\n" +
             "+-- GET  /systeminfo                         - general info about LCARS system\n" +
             "+-- GET  /lcarslog                           - get all log entries from LCARS log\n" +
             "+-- GET  /profiles                           - get all profiles\n" +
             " +- GET  /profiles/[pid]                     - get a single profile\n" +
             "+-- GET  /responserecipes                    - get names and ids of all response recipes\n" +
             " +- GET  /responserecipes/[rrid]             - get all response details of a specified recipe [rrid]\n" +
             "+-- GET  /responsedetails                    - get all response details and recipe association\n" +
             "+-- GET  /orchestration                      - get orchestration for all profiles\n" + 
             " +- GET  /orchestration/[pid]                - get orchestration for one profile\n" + 
             "+-- GET  /models                             - get neural network models LCARS knows about (in models directory)\n" +
             "\n" +
             "+-- PUT  /profiles                           - create a new profile using body JSON: {\"name\": \"Profile Name\", \"details\": \"Profile Details\"}\n" +
             "+-- PUT  /responserecipes                    - create a new response recipe using body JSON: {\"name\": \"Recipe Name\"}\n" +
             "+-- PUT  /responsedetails                    - add a response detail to an existing recipe using body JSON: {\"rrid\" : \"Recipe ID\", \"ruleorder\" : \"Order Number\", \"target\" : \"[drop, accept, reject]\",\n" +
             "                                                                                                             \"chain\" : \"[input, output, forward]\", \"protocol\" : \"Protocol Name\",\n" +
             "                                                                                                             \"source\" : \"Source IP\", \"destination\" : \"Dest. IP\"}\n" +
             "+-- PUT  /orchestration                      - create a new orchestrated response using body JSON: {\"pid\" : \"Profile ID\", \"rrid\" : \"Recipe ID\"}\n" +
             "+-- PUT  /lcarslog                           - create a new LCARS log entry using body JSON: {\"category\" : \"Entry Type\", \"message\" : \"Entry Message\"}\n" +
             "\n" +
             "+-- POST /savelog                            - save existing honeypot or BlackRidge log as an Experimental log using body JSON: {\"pathToLog\": \"Path to existing log\", \"filename\": \"Filename to save as\"}\n" +
             "+-- POST /profiles/[pid]                     - update existing profile using body JSON: {\"name\": \"Profile Name\", \"details\": \"Profile Details\"}\n" +
             "+-- POST /responserecipes/[rrid]             - update existing recipe using body JSON: {\"name\": \"Profile Name\"}\n" +
             "+-- POST /responsedetails/[rdid]             - update an existing response detail in a recipe using body JSON: {\"rrid\" : \"Recipe ID\", \"ruleorder\" : \"Order Number\", \"target\" : \"[drop, accept, reject]\",\n" +
             "                                                                                                                \"chain\" : \"[input, output, forward]\", \"protocol\" : \"Protocol Name\",\n" +
             "                                                                                                                \"source\" : \"Source IP\", \"destination\" : \"Dest. IP\"}\n" +
             "\n" +
             "+-- DELETE /profiles                         - delete all existing profiles\n" +
             " +- DELETE /profiles/[pid]                   - delete an existing profile\n" +
             "+-- DELETE /responserecipes                  - delete all existing response recipes\n" +
             " +- DELETE /responserecipes/[rrid]           - delete an existing response recipe\n" +
             "+-- DELETE /responsedetails                  - delete all existing response details\n" +
             " +- DELETE /responsedetails/[rdid]           - delete an existing response detail\n" +
             "+-- DELETE /orchestration                    - delete all existing orchestration records\n" +
             " +- DELETE /orchestration/[pid]              - delete all orchestration records associated with a specific profile\n" +
             " +- DELETE /orchestration/[pid]/[rrid]       - delete an existing orchestration record\n" +
             "";
   }

   private StringBuilder responseGetVersion() {
      StringBuilder sb = new StringBuilder();
      String version = apiVersion;
      sb.append("{ " + "\"version\" : " + "\"" + version + "\"" + " }");
      return sb;
   }

   private StringBuilder responseGetDate() {
      StringBuilder sb = new StringBuilder();
      DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd");
      java.util.Date date = new java.util.Date();
      String dateStr = dateFormat.format(date);            
      sb.append("{ " + "\"currentDate\" : " + "\"" + dateStr + "\"}");
      return sb;
   }

   private StringBuilder responseGetTime() {
      StringBuilder sb = new StringBuilder();
      DateFormat dateFormat = new SimpleDateFormat("HH:mm:ss.SSSS");
      java.util.Date date = new java.util.Date();
      String timeStr = dateFormat.format(date);            
      sb.append("{ " + "\"currentTime\" : " + "\"" + timeStr + "\"}");
      return sb;
   }

   private StringBuilder responseGetDateTime() {
      StringBuilder sb = new StringBuilder();
      DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSSS");
      java.util.Date date = new java.util.Date();
      String dateTimeStr = dateFormat.format(date);            
      sb.append("{ " + "\"currentDateTime\" : " + "\"" + dateTimeStr + "\"}");
      return sb;
   }
   
   private StringBuilder responseGetHPInfo() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/hpinfo.sh"};
      return runShellScript(command);
   }

   private StringBuilder responseGetBlackRidgeInfo() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/blackridgeLogInfo.sh"};
      return runShellScript(command);
   }

   private StringBuilder responseGetExperimentalLogs() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/experimentalLogInfo.sh"};
      return runShellScript(command);
   }

   private StringBuilder responseGetLogEntriesCount() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/logCount.sh"};
      return runShellScript(command);
   }

   private StringBuilder responseGetAttacksCount() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/attacksCount.sh"};
      return runShellScript(command);
   }

   private StringBuilder responseGetCountryData() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/countryData.sh"};
      return runShellScript(command);
   }
   
   private StringBuilder responseGetOsVersion() {
      //return runShellScript("osqueryi --json 'select * from os_version'");
      String[] command = new String[]{"/var/www/html/lcars/scripts/osquery.sh", "osversion"};
      return runShellScript(command);
   }

   private StringBuilder responseGetModels() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/getModels.sh"};
      return runShellScript(command);
   }

   private StringBuilder responseGetTests() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/getTests.sh"};
      return runShellScript(command);
   }
   
   private StringBuilder responseGetInterfaceDetails() {
      String[] command = new String[]{"/var/www/html/lcars/scripts/osquery.sh", "interfacedetails"};
      return runShellScript(command);
   }
   
   private StringBuilder responseGetIptables() {
       String[] command = new String[]{"/var/www/html/lcars/scripts/osquery.sh", "iptables"};
       return runShellScript(command);
   }
   
   private StringBuilder responseGetSystemInfo() {
       String[] command = new String[]{"/var/www/html/lcars/scripts/osquery.sh", "systeminfo"};
       return runShellScript(command);
   }
   
   private StringBuilder responseGetLcarsLog() {
       return runSelectQuery("SELECT * FROM LcarsLogEntries ORDER BY createdate DESC");
   }
   
   private StringBuilder responsePutLcarsLog(JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       String category = reqJSON.get("category").getAsString();
       String message = reqJSON.get("message").getAsString();
       
       createLcarsLogEntry(category, message);
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb;
   }

   private StringBuilder responsePostExperimentalLog(JsonObject reqJSON) {
       String pathToLog = reqJSON.get("pathToLog").getAsString();
       String filename = reqJSON.get("filename").getAsString();

       String[] command = new String[]{"/var/www/html/lcars/scripts/saveAsExperimental.sh", pathToLog, filename};
       return runShellScript(command);
   }

   private StringBuilder responsePostPrediction(JsonObject reqJSON) {
      String modelName = reqJSON.get("model_name").getAsString();
      String modelWeights = reqJSON.get("model_weights").getAsString();
      String matrix = reqJSON.get("matrix").getAsString();
      String[] command = new String[]{"python","/var/www/html/lcars/scripts/ML.py", modelName, modelWeights, matrix};
      
      return runShellScript(command);
   }

   private StringBuilder responsePostConfig(JsonObject reqJSON) {
      String modelName = reqJSON.get("model_name").getAsString();
      String[] command = new String[]{"/var/www/html/lcars/scripts/getConfigOptions.sh", modelName};
      
      return runShellScript(command);
   }

   private StringBuilder responseGetProfiles() {
       return runSelectQuery("SELECT * FROM Profiles ORDER BY pid");       
   }
   
   private StringBuilder responseGetProfile(int pid) {
       // Return list of response recipes with the name of the profile
       String query = "SELECT * FROM Profiles WHERE pid = " + pid;
       return runSelectQuery(query);
   }
   
   private StringBuilder responseUpdateProfile(int pid, JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       String name = reqJSON.get("name").getAsString();
       String details = reqJSON.get("details").getAsString();
       
       String query = "UPDATE Profiles SET name = '" + name + "', "
               + "details = '" + details + "', "
               + "updatedate = now()::timestamp(0) "
               + "WHERE pid = " + pid;
       dbCommand(query);
       
       createLcarsLogEntry("Attack Profiles", "Edited attack profile (pid: " + pid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responsePutProfile(JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       String name = reqJSON.get("name").getAsString();
       String details = reqJSON.get("details").getAsString();
       
       String query = "INSERT INTO Profiles (name, details) VALUES "
               + "('" + name + "', '" + details + "')";
       dbCommand(query);
       
       createLcarsLogEntry("Attack Profiles", "Created attack profile " + name + " (" + details + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb;
   }
   
   private StringBuilder responseDeleteProfiles() {
       StringBuilder sb = new StringBuilder();
       
       // Delete all of the response recipes (also deletes all orchestration information).
       String deleteOrchestrations = "DELETE FROM Orchestration WHERE TRUE";
       String deleteProfiles = "DELETE FROM Profiles WHERE TRUE";
       
       dbCommand(deleteOrchestrations);
       dbCommand(deleteProfiles);
       
       createLcarsLogEntry("Attack Profiles", "Deleted all attack profiles");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb; 
   }
   
   private StringBuilder responseDeleteProfile(int pid){
       StringBuilder sb = new StringBuilder();
       
       // Delete a particular profile (also deletes its associated orchestration information).
       String deleteProfile = "DELETE FROM Profiles"
               + " WHERE pid = " + pid;
       
       String deleteOrchestration = "DELETE FROM Orchestration"
               + " WHERE pid = " + pid;
       
       dbCommand(deleteOrchestration);
       dbCommand(deleteProfile);
       
       createLcarsLogEntry("Attack Profiles", "Deleted attack profile (pid: " + pid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb;
   }
   
   private StringBuilder responseGetResponseRecipes() {
       return runSelectQuery("SELECT * FROM ResponseRecipes ORDER BY rrid");       
   }
   
   private StringBuilder responseGetResponseDetails() {
       return runSelectQuery("SELECT * FROM ResponseDetails");       
   }
   
   private StringBuilder responsePutResponseDetail(JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       int rrid           = reqJSON.get("rrid").getAsInt();
       int ruleorder      = reqJSON.get("ruleorder").getAsInt();
       String target      = reqJSON.get("target").getAsString();
       String chain       = reqJSON.get("chain").getAsString();
       String protocol    = reqJSON.get("protocol").getAsString();
       String source      = reqJSON.get("source").getAsString();
       String destination = reqJSON.get("destination").getAsString();
       
       String addDetail = "INSERT INTO ResponseDetails (rrid, ruleorder, target, chain, protocol, source, destination) VALUES "
               + "(" + rrid + ", " + ruleorder + ", '" + target + "', '" + chain + "', '" + protocol + "', '" + source + "', "
               + "'" + destination + "')";
       String updateRecipeDate = "UPDATE ResponseRecipes SET updatedate = now()::timestamp(0) "
               + "WHERE rrid = " + rrid;
       dbCommand(addDetail);
       dbCommand(updateRecipeDate);
       
       createLcarsLogEntry("Response Recipes", "Created new response detail for rrid " + rrid);
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseUpdateResponseDetail(int rdid, JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       int rrid           = reqJSON.get("rrid").getAsInt();
       int ruleorder      = reqJSON.get("ruleorder").getAsInt();
       String target      = reqJSON.get("target").getAsString();
       String chain       = reqJSON.get("chain").getAsString();
       String protocol    = reqJSON.get("protocol").getAsString();
       String source      = reqJSON.get("source").getAsString();
       String destination = reqJSON.get("destination").getAsString();

       // This probably isn't the best way to do this, but it works for now.
       JsonObject jsonResult = new JsonObject();
       // Get the result of this query as a String (with brackets removed so it doesn't look like an array),
       // so it can be parsed by the JSON Parser.
       String result = runSelectQuery("SELECT ruleorder FROM ResponseDetails WHERE rdid = " + rdid).toString().replaceAll("\\[|\\]", "");
       jsonResult = new JsonParser().parse(result).getAsJsonObject();
       // Get the current rule order for the response detail that is being editied.
       int currentRuleOrder = jsonResult.get("responsedetails__ruleorder").getAsInt();

       // This checks if the rule order field was edited, and if so, updates the rule orders in the database.
       if (currentRuleOrder != ruleorder) {
           // currentRuleOrder > ruleorder means for example, changing rule order from 3 to 1
           if (currentRuleOrder > ruleorder) {
               String updateRuleOrders = "UPDATE ResponseDetails SET ruleorder = ruleorder + 1 "
                       + "WHERE ruleorder >= " + ruleorder + " "
                       + "AND ruleorder < " + currentRuleOrder + " "
                       + "AND rrid = " + rrid;

               dbCommand(updateRuleOrders);
           // currentRuleOrder < ruleorder means for example, changing rule order from 1 to 3
           } else if (currentRuleOrder < ruleorder) {
               String updateRuleOrders = "UPDATE ResponseDetails SET ruleorder = ruleorder - 1 " 
                       + "WHERE ruleorder <= " + ruleorder + " "
                       + "AND ruleorder > " + currentRuleOrder + " "
                       + "AND rrid = " + rrid;

               dbCommand(updateRuleOrders);
           } 

           // Update the rule order for the rule that we're editing to the new rule order
           String updateRuleOrderForDetail = "UPDATE ResponseDetails SET ruleorder = " + ruleorder + " "
                   + "WHERE rdid = " + rdid + " "
                   + "AND rrid = " + rrid;

           dbCommand(updateRuleOrderForDetail);
       }

       // Update the other response details fields
       String updateDetail = "UPDATE ResponseDetails SET target = '" + target + "', "
               + "chain = '" + chain + "', protocol = '" + protocol + "', "
               + "source = '" + source + "', destination = '" + destination + "' "
               + "WHERE rdid = " + rdid;
       String updateRecipeDate = "UPDATE ResponseRecipes SET updatedate = now()::timestamp(0) "
               + "WHERE rrid = " + rrid;
       dbCommand(updateDetail);
       dbCommand(updateRecipeDate);
       
       createLcarsLogEntry("Response Recipes", "Edited response detail (rdid: " + rdid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseDeleteResponseDetail(int rdid) {
       StringBuilder sb = new StringBuilder();
      
       String updateOrder = "UPDATE ResponseDetails SET ruleorder = ruleorder - 1 "
               + "WHERE rrid = (SELECT rrid FROM ResponseDetails WHERE rdid = " + rdid + ") "
               + "AND ruleorder > (SELECT ruleorder FROM ResponseDetails WHERE rdid = " + rdid + ")";
       String updateRecipeDate = "UPDATE ResponseRecipes SET updatedate = now()::timestamp(0) "
               + "WHERE rrid = (SELECT rrid FROM ResponseDetails WHERE rdid = " + rdid + ")";
       String deleteDetail = "DELETE FROM ResponseDetails WHERE "
               + "rdid = " + rdid;

       dbCommand(updateOrder);
       dbCommand(updateRecipeDate);
       dbCommand(deleteDetail);

       createLcarsLogEntry("Response Recipes", "Deleted response detail (rdid: " + rdid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseDeleteResponseDetails(){
       StringBuilder sb = new StringBuilder();
       
       String query = "DELETE FROM ResponseDetails WHERE TRUE";
       dbCommand(query);
       
       createLcarsLogEntry("Response Recipes", "Deleted all response details");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseGetOrchestration() {
       
       String query = "SELECT p.name, p.pid, rr.rrid, rr.name, rd.target, rd.chain, "
                    + "rd.protocol, rd.source, rd.destination "
                    + "FROM Profiles AS p INNER JOIN Orchestration AS o ON p.pid = o.pid "
                    + "                   INNER JOIN ResponseRecipes AS rr ON o.rrid = rr.rrid "
                    + "                   INNER JOIN ResponseDetails AS rd ON rr.rrid = rd.rrid "
                    + "ORDER BY rd.ruleorder";
       
       return runSelectQuery(query);         
   }
   
   private StringBuilder responseGetSingleOrchestration(int pid) {
       String query = "SELECT p.name, rr.rrid, rr.name "
               + "FROM Profiles AS p INNER JOIN Orchestration AS o ON p.pid = o.pid "
               + "                   INNER JOIN ResponseRecipes AS rr ON o.rrid = rr. rrid "
               + "WHERE o.pid = " + pid;
       
       return runSelectQuery(query);
   }
   
   private StringBuilder responsePutOrchestration(JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       int pid  = reqJSON.get("pid").getAsInt();
       int rrid = reqJSON.get("rrid").getAsInt();
       
       String query = "INSERT INTO Orchestration (pid, rrid) VALUES "
               + "('" + pid + "', '" + rrid + "')";
       dbCommand(query);
       
       createLcarsLogEntry("Orchestration", "Created new orchestration record for pid " + pid + " and rrid " + rrid);
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb;
   }
   
   private StringBuilder responseDeleteOrchestration(){
       StringBuilder sb = new StringBuilder();
       
       String query = "DELETE FROM Orchestration WHERE TRUE";
       dbCommand(query);
       
       createLcarsLogEntry("Orchestration", "Deleted all orchestration records");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseDeleteSingleOrchestration(int pid, int rrid){
       StringBuilder sb = new StringBuilder();
       
       String query = "DELETE FROM Orchestration WHERE pid = " + pid + " AND rrid = " + rrid;
       dbCommand(query);
       
       createLcarsLogEntry("Orchestration", "Deleted orchestration record (pid: " + pid + ", rrid: " + rrid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseDeleteOrchestrationProfile(int pid) {
       StringBuilder sb = new StringBuilder();
       
       String query = "DELETE FROM Orchestration WHERE pid = " + pid;
       dbCommand(query);
       
       createLcarsLogEntry("Orchestration", "Deleted all orchestration for attack profile (pid: " + pid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responseGetResponseRecipe(int rrid) {
       // Returns a list of response details with the name of the recipe
       String query = "SELECT rr.name, rd.rdid, rd.ruleorder, rd.target, rd.chain, "
               + "rd.protocol, rd.source, rd.destination "
               + "FROM ResponseRecipes AS rr "
               + "INNER JOIN ResponseDetails AS rd ON rr.rrid = rd.rrid "
               + "WHERE rr.rrid=" + rrid + " "
               + "ORDER BY rd.ruleorder";
       return runSelectQuery(query);
   }
   
   private StringBuilder responseUpdateResponseRecipe(int rrid, JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       String name = reqJSON.get("name").getAsString();
       
       String query = "UPDATE ResponseRecipes SET name = '" + name + "', "
               + "updatedate = now()::timestamp(0) "
               + "WHERE rrid = " + rrid;
       dbCommand(query);
       
       createLcarsLogEntry("Response Recipes", "Edited response recipe (rrid: " + rrid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       return sb;
   }
   
   private StringBuilder responsePutResponseRecipe(JsonObject reqJSON) {
       StringBuilder sb = new StringBuilder();
       
       String name = reqJSON.get("name").getAsString();
       
       String query = "INSERT INTO ResponseRecipes (name) VALUES "
               + "('" + name + "')";
       dbCommand(query);
       
       createLcarsLogEntry("Response Recipes", "Created new response recipe " + name);
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb;
   }
   
   private StringBuilder responseDeleteResponseRecipes() {
       StringBuilder sb = new StringBuilder();
       
       // Delete all of the response recipes (also deletes all recipedetails, and orchestration information).
       String deleteDetails = "DELETE FROM ResponseDetails WHERE TRUE";
       String deleteOrchestrations = "DELETE FROM Orchestration WHERE TRUE";
       String deleteRecipes = "DELETE FROM ResponseRecipes WHERE TRUE";
       
       dbCommand(deleteDetails);
       dbCommand(deleteOrchestrations);
       dbCommand(deleteRecipes);
       
       createLcarsLogEntry("Response Recipes", "Deleted all response recipes");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb; 
   }
   
   private StringBuilder responseDeleteResponseRecipe(int rrid){
       StringBuilder sb = new StringBuilder();
       
       // Delete a particular response recipe (also deletes its associated response detail, and orchestration information).
       String deleteDetail = "DELETE FROM ResponseDetails"
               + " WHERE rrid = " + rrid;
       
       String deleteOrchestration = "DELETE FROM Orchestration"
               + " WHERE rrid = " + rrid;
       
       String deleteRecipe = "DELETE FROM ResponseRecipes "
               + " WHERE rrid = " + rrid;
       
       dbCommand(deleteDetail);
       dbCommand(deleteOrchestration);
       dbCommand(deleteRecipe);
       
       createLcarsLogEntry("Response Recipes", "Deleted response recipe (rrid: " + rrid + ")");
       
       sb.append(makeJSON(messageKey, "200 OK"));
       
       return sb;
   }

   //
   // HTML utility routines
   //
   private StringBuilder createHeader(String heading) {
      final String title = apiName;
      final String copyright = "Copyright (c) 2016 Alan G. Labouseur and the Marist NSF-Stars. All Rights Reserved.";
      StringBuilder retVal = new StringBuilder();
      retVal.append("<!DOCTYPE html>");
      retVal.append("<html>");
      retVal.append("<head>");
      retVal.append("<title>" + title + "</title>");
      retVal.append("<meta http-equiv=\"Content-Type\" content=\"text/html;charset=utf-8\" />");
      String postTesterJavaScript =
           "<script src='//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js'></script>"
         + "<script type='text/javascript'>"
         + "function sendIt(method) {"
         + "   addressToUse = window.location.hostname + ':8081';"
         + "   var url = 'http:' + String.fromCharCode(47,47) + addressToUse + '/';"
         + "   var reqJSON = document.getElementById('requestBody').value;"
         + "   if (method === 'GET') {"
         + "      var commandText = document.getElementById('txt2get').value;"
         + "      url = url + commandText;"
         + "      window.location = url;"
         + "   } else if (method === 'POST') {"
         + "      var commandText = document.getElementById('txt2post').value;"
         + "      url = url + commandText;"
         + "      $.ajax(url, {"
         + "         'data': reqJSON,"
         + "         'type': 'POST',"
         + "         'processData': false,"
         + "         'contentType': 'application/json',"
         + "         'crossDomain': true"
         + "      })"
         + "         .success(function (data, status) {"
         + "            var msg = 'status: ' + status + '\\n';"
         + "            if (data.message) {"
         + "               msg += data.message;"
         + "            } else {"
         + "               try {"
         + "                  msg += JSON.parse(data).message;"
         + "               } catch (ex) {"
         + "                  msg += ex.message + ' data = ' + 'data.message = ' + data.message;"
         + "               }"
         + "            }"
         + "            display(msg);"
         + "         })"
         + "         .fail(function () {"
         + "             display('Error: POST failure.');"
         + "         });"
         + "   } else if (method === 'PUT') {"
         + "      var commandText = document.getElementById('txt2put').value;"
         + "      url = url + commandText;"
         + "      $.ajax(url, {"
         + "         'data': reqJSON,"
         + "         'type': 'PUT',"
         + "         'processData': false,"
         + "         'contentType': 'application/json',"
         + "         'crossDomain': true"
         + "      })"
         + "         .success(function (data, status) {"
         + "            var msg = 'status: ' + status + '\\n';"
         + "            if (data.message) {"
         + "               msg += data.message;"
         + "            } else {"
         + "               try {"
         + "                  msg += JSON.parse(data).message;"
         + "               } catch (ex) {"
         + "                  msg += ex.message + ' data = ' + 'data.message = ' + data.message;"
         + "               }"
         + "            }"
         + "            display(msg);"
         + "         })"
         + "         .fail(function () {"
         + "             display('Error: PUT failure.');"
         + "         });"
         + "   } else if (method === 'DELETE') {"
         + "      var commandText = document.getElementById('txt2delete').value;"
         + "      url = url + commandText;"
         + "      $.ajax(url, {"
         + "         'data': '',"
         + "         'type': 'DELETE',"
         + "         'processData': false,"
         + "         'contentType': 'application/json',"
         + "         'crossDomain': true"
         + "      })"
         + "         .success(function (data, status) {"
         + "            var msg = 'status: ' + status + '\\n';"
         + "            if (data.message) {"
         + "               msg += data.message;"
         + "            } else {"
         + "               try {"
         + "                  msg += JSON.parse(data).message;"
         + "               } catch (ex) {"
         + "                  msg += ex.message + ' data = ' + 'data.message = ' + data.message;"
         + "               }"
         + "            }"
         + "            display(msg);"
         + "         })"
         + "         .fail(function () {"
         + "             display('Error: DELETE failure.');"
         + "         });"
         + "   } else {"
         + "      alert(method + ' is not defined.');"
         + "   }"
         + "}"
         + "function display(msg) {"
         + "   document.getElementById('taDisplay').value = msg;"
         + "}"
         + "</script>";
      retVal.append(postTesterJavaScript);
      retVal.append("</head>");
      retVal.append("<body>");
      retVal.append("<h3>" + title + "</h3>");
      retVal.append("<h4>" + copyright+ "</h4>");
      retVal.append("<h1>" + heading + "</h1>");
      return retVal;
   }

   private StringBuilder createFooter() {
      StringBuilder retVal = new StringBuilder();
      retVal.append("</body>");
      retVal.append("</html>");
      return retVal;
   }

   private String toString(Map<String, ? extends Object> map) {
      if (map.size() == 0) {
         return "";  // TODO This is bad code style. Fix it.
      }
      return toUnsortedList(map);
   }

   private String toUnsortedList(Map<String, ? extends Object> map) {
      StringBuilder sb = new StringBuilder();
      sb.append("<ul>");
      for (Map.Entry<?,?> entry : map.entrySet()) {
         makeListItem(sb, entry);
      }
      sb.append("</ul>");
      return sb.toString();
   }

   private void makeListItem(StringBuilder sb, Map.Entry<?,?> entry) {
      sb.append("<li><code><b>")
        .append(entry.getKey())
        .append("</b> = ")
        .append(entry.getValue())
        .append("</code></li>");
   }


   //
   // API utility routines.
   //

   /**
    * Construct a one-message JSON object from the passed-in key and value strings.
    * @param  key
    * @param  value
    * @return JSON string
    */
   private String makeJSON(String key, String value) {
      return "{\""+ key + "\":\"" + value + "\"}";
   }

   /**
    * Add JSON and Access-Control headers to the passed-by-reference response object.
    * @param response
    */
   private void addApiResponseHeaders(NanoHTTPD.Response response) {
      response.addHeader("Content-Type", "application/json");
      response.addHeader("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, OPTIONS");
      response.addHeader("Access-Control-Allow-Origin",  "*");
      response.addHeader("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
   }
   
   /**
    * Prints the contents of a HashMap.
    * @param hashmap
    */
   private void printHashMapContent(Map<String, String> hashmap) {
      Object[] hashMapArray = hashmap.entrySet().toArray();
      for(int i = 0; i < hashMapArray.length; i++) {
         System.out.println(hashMapArray[i]);
      }
   }

   /**
    * Execute shell script and get the data returned.
    * @param pathToScript
    * @return a string builder of the data received (output of the script should be in JSON format)
    */
   private StringBuilder runShellScript(String[] pathToScript) {
      StringBuilder sb = new StringBuilder();

      String line;
      try {
          Process executeScript = Runtime.getRuntime().exec(pathToScript);
          BufferedReader reader = new BufferedReader(new InputStreamReader(executeScript.getInputStream()));
          BufferedReader errorReader = new BufferedReader(new InputStreamReader(executeScript.getErrorStream()));
          while ((line = reader.readLine()) != null) {
              sb.append(line);
          }

          while((line = errorReader.readLine()) != null) {
            writeLog(line);
          }

      } catch (IOException e) {
           e.printStackTrace();
      }

      return sb;
   }

   /**
    * Write to the error log database tables and text stream.
    * @param log
    */
   private void writeLog(String log) {
      String insertCommand = "INSERT INTO errorlogs(error_string, time, source, severity) " +
                             "VALUES ('" + log + "', current_timestamp, 'back-end', 0)";
      // Try and write to the database.
      try {
         dbCommand(insertCommand);
      } catch (Exception ex) {
         ex.printStackTrace();
      }
      // Try and write to the text stream.
      try(PrintWriter output = new PrintWriter(new BufferedWriter(new FileWriter("logs.txt", true)))) {

         output.println(new java.util.Date() + "~Back-end~" + log);
      } catch (IOException ex) {
         ex.printStackTrace();
      }
   }

   /**
    * Insert a new entry into the LCARS log
    * @param category String denoting the type of event being logged
    * @param message  String description of event
    */
   private void createLcarsLogEntry(String category, String message) {
       String query = "INSERT INTO LcarsLogEntries(category, message) " +
                      "VALUES ('" + category + "', '" + message + "')";
       dbCommand(query);
   }

   /**
    * Perform the database non-query command (e.g., insert, update, delete)
    * and get the return code. It is unsure at this time (5/4/2015) if the return code is needed is needed.
    * @param command
    */
   private void dbCommand(String command) {
      if (this.databaseConnection != null) {
         Statement st = null;
         int result;
         try {
            st = databaseConnection.createStatement();
            result = st.executeUpdate(command);
         } catch (SQLException ex) {
            ex.printStackTrace();
         } finally {
            try {
               st.close();
            } catch (Exception ex) {
               ex.printStackTrace();
            }
         }
      } else {
         System.err.println("dbCommand() tried to run, but there is no connection to the database.");
      }
   }

   /**
    * Execute the EXPLAIN query
    * @param query
    * @return a string builder of the data received
    */
   private StringBuilder runExplainQuery(String query) {
      StringBuilder sb = new StringBuilder();

      if (this.databaseConnection != null) {
         Statement st = null;
         ResultSet rs = null;
         try {
            st = databaseConnection.createStatement();
            rs = st.executeQuery(query);

            ResultSetMetaData rsmd = rs.getMetaData();

            sb.append("[{");
            while (rs.next()) {
               sb.append("\"" + rsmd.getColumnName(1) + "\" : " + "\"" + rs.getString(1) + "\"");
               if (!rs.isLast()) {
                  sb.append("}, {");
               }
            }
            sb.append("}]");

            rs.close();
            st.close();

         } catch (SQLException ex) {
            System.err.println(ex.toString());
            sb.append("[" + makeJSON("error", ex.toString()) + "]");
         }
      } else {
         return sb.append("[" + makeJSON("error", "Unable to run query. The connection to the database does not exist.") + "]");
      }

      return sb;
   }
   
   /** 
   * Execute SELECT query on a relational database
   * @param query
   * @return JSON string
   */
   private StringBuilder runSelectQuery(String query) {
      StringBuilder sb = new StringBuilder();

      if (this.databaseConnection != null) {
         final String separatorStr = "__";
         Statement st = null;
         ResultSet rs = null;
         try {
            st = databaseConnection.createStatement(ResultSet.TYPE_SCROLL_SENSITIVE, ResultSet.CONCUR_READ_ONLY); // TODO: Check scroll_type.
            rs = st.executeQuery(query);
            if (!rs.next()) {
               // No rows were returned.
               // Display the column headings only.
               sb.append("[{");
               ResultSetMetaData rsmd = rs.getMetaData();
               int columnCount = rsmd.getColumnCount();
               // Put the column names directly into our return value sb.
               // Iterate over the column names.
               for (int i = 1; i <= columnCount; i++) {
                  if (i > 1) {
                     sb.append(", ");
                  }
                  if (!rsmd.getTableName(i).equals("")) {
                     // We DO have the table name, so prefix the column with it.
                     sb.append("\"" + rsmd.getTableName(i) + separatorStr + rsmd.getColumnName(i) + "\" : \"\"");
                  } else {
                     // We DO NOT have the table name, so use only the column name.
                     // (This can happen with some JDBC drivers.)
                     sb.append("\"" + rsmd.getColumnName(i) + "\" : \"\"");
                  }
               }
               sb.append("}]");
            } else {
               // Some rows were returned.
               // Display column heading and data.
               // This is necessary because of using rs.next() in the if statement
               // Otherwise we will not get all of the data
               rs.beforeFirst();  // TODO: Is this necessary?
               ResultSetMetaData rsmd = rs.getMetaData();
               int columnCount = rsmd.getColumnCount();
               // Declare an array of Strings to hold the column names.
               ArrayList<String> columnNames = new ArrayList<String>();
               // Iterate over the column names.
               for (int i = 1; i <= columnCount; i++) {
                  if (!rsmd.getTableName(i).equals("")) {
                     // We DO have the table name, so prefix the column with it.
                     columnNames.add(rsmd.getTableName(i) + separatorStr + rsmd.getColumnLabel(i));
                  } else {
                     // We DO NOT have the table name, so use only the column name.
                     columnNames.add(rsmd.getColumnLabel(i));
                  }
               }

               sb.append("[{");
               // Iterate over the data rows.
               while (rs.next()) {
                  for (int i = 1; i <= columnCount; i++) {
                     if (i > 1) {
                        sb.append(", ");
                     }
                     String content = rs.getString(i);
                     sb.append("\"" + columnNames.get(i - 1) + "\" : " + "\"" + content + "\"");  // i-1 because columnNames is 0-based.
                  }
                  if (!rs.isLast()) {
                     sb.append("}, {");
                  }
               }
               sb.append("}]");
            }
            // Close the ResultSet and Statement.
            rs.close();
            st.close();
         } catch (SQLException ex) {
            // Return the error without all the Java exception details that the user does not need to know.
            // Format the string properly for JSON.
            String exception = ex.toString();
            int errorIndex = exception.indexOf("ERROR:") + 6;
            int positionIndex = exception.indexOf("Position:");
            String errorText = exception.substring(errorIndex, positionIndex).replaceAll("\"", "\'").replaceAll("\n", "").replaceAll("\r", "").trim();
            sb.append("[" + makeJSON("error", errorText) + "]");
         }
         return sb;
      } else {
         return sb.append("[" + makeJSON("error", "Unable to run query. The connection to the database does not exist.") + "]");
      }
   }
}
