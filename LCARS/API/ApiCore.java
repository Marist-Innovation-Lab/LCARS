package apicore;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * LCARS API Core - Requires PostgreSQL JDBC Driver
 * @author Liam Harwood
 */
public class ApiCore {
    
    /**
     * Retrieve response recipes from the database
     * 
     * @param c Connection object for database
     * @return responseRecipes String (JSON-like) representing response recipes
     */
    public static String getResponseRecipes(Connection c) {
        String responseRecipes = "";
        
        try {
            Statement stmt = c.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM ResponseRecipes;");
            
            while(rs.next()) {
                int rrid = rs.getInt("rrid");
                String name = rs.getString("name");
                
                responseRecipes += "{\"rrid\": " + rrid + ", ";
                responseRecipes += "\"name\": \"" + name + "\"}\n";
            }
            rs.close();
            stmt.close();
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);
        }
        
        return responseRecipes;
    }
    /**
     * Insert a new response recipe into the database
     * 
     * @param c Connection object for database
     * @param name String The name of the response recipe
     */
    public static void insertResponseRecipe(Connection c, String name) { 
        try {
            Statement stmt = c.createStatement();
            String sql = "INSERT INTO ResponseRecipes (name) "
                    + "VALUES ('" + name + "');";
            stmt.executeUpdate(sql);
            stmt.close();
            c.commit();
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);            
        }
    }
    
    /**
     * Retrieve profiles from the database
     * 
     * @param c Connection object for database
     * @return profiles String (JSON-like) representing response recipes
     */
    public static String getProfiles(Connection c) {
        String profiles = "";
        
        try {
            Statement stmt = c.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM Profiles;");
            
            while(rs.next()) {
                int pid = rs.getInt("pid");
                String name = rs.getString("name");
                String details = rs.getString("details");
                String createDate = rs.getString("createdate");
                
                profiles += "{\"pid\": " + pid + ", ";
                profiles += "\"name\": \"" + name + "\", ";
                profiles += "\"details\": \"" + details + "\", ";
                profiles += "\"createdate\": \"" + createDate + "\"}\n";
            }
            rs.close();
            stmt.close();
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);           
        }
        
        return profiles;
    }
    
    /**
     * Insert a new profile into the database
     * 
     * @param c Connection object for database
     * @param name String The name of the profile
     * @param details String A description of the profile
     */
    public static void insertProfile(Connection c, String name, String details) { 
        try {
            Statement stmt = c.createStatement();
            String sql = "INSERT INTO Profiles (name, details, createdate) "
                    + "VALUES ('" + name + "', '" + details + "', now() );";
            stmt.executeUpdate(sql);
            stmt.close();
            c.commit();
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);            
        }
    }

    /**
     * Retrieve response details from database
     * 
     * @param c Connection object for database
     * @return responseDetails String (JSON-like) representing response details
     */
    public static String getResponseDetails(Connection c) {
        String responseDetails = "";
        
        try {
            Statement stmt = c.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM ResponseDetails");
            
            while(rs.next()) {
                int rrid = rs.getInt("rrid");
                int rulenum = rs.getInt("rulenum");
                String target = rs.getString("target");
                String chain = rs.getString("chain");
                String protocol = rs.getString("protocol");
                String source = rs.getString("source");
                String destination = rs.getString("destination");
                
                responseDetails += "{\"rrid\": " + rrid + ", ";
                responseDetails += "\"rulenum\": " + rulenum + ", ";
                responseDetails += "\"target\": \"" + target + "\", ";
                responseDetails += "\"chain\": \"" + chain + "\", ";
                responseDetails += "\"protocol\": \"" + protocol + "\", ";
                responseDetails += "\"source\": \"" + source + "\", ";
                responseDetails += "\"destination\": \"" + destination + "\"}\n";
            }
            rs.close();
            stmt.close();           
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);            
        }
        
        return responseDetails;
    }

    /**
     * Retrieve orchestration information from the database
     * 
     * @param c Connection object for database
     * @return orchestration String (JSON-like) representing orchestration
     */
    public static String getOrchestration(Connection c) {
        String orchestration = "";
        
        try {
            Statement stmt = c.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM Orchestration");
            
            while(rs.next()) {
                int pid = rs.getInt("pid");
                int rrid = rs.getInt("rrid");
                
                orchestration += "{\"pid\": " + pid + ", ";
                orchestration += "\"rrid\": " + rrid + "}\n";
            }
            rs.close();
            stmt.close();           
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);            
        }
        
        return orchestration;
    }
    
    /**
     * Test database interactions
     * 
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        Connection c = null;
        
        // Database info read from dbinfo.txt (3 lines: address, user, password)
        File dbFile = new File("dbinfo.txt");
        String dbAddress = "";
        String dbUser = "";
        String dbPassword = "";
        
        try {
            Scanner input = new Scanner(dbFile);
            dbAddress = input.nextLine();
            dbUser = input.nextLine();
            dbPassword = input.nextLine();
            input.close();
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);
        }
        
        // Connect to the database
        try {
            Class.forName("org.postgresql.Driver");
            c = DriverManager.getConnection(dbAddress, dbUser, dbPassword);
            c.setAutoCommit(false);
            System.out.println("Opened database successfully");  
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);
        }
        
        // Test some database stuff       
        // insertProfile(c, "test", "test");
        // insertResponseRecipe(c, "test");
        System.out.println();
        System.out.print(getProfiles(c));
        System.out.println();
        System.out.print(getResponseRecipes(c));
        System.out.println();
        System.out.print(getResponseDetails(c));
        System.out.println();
        System.out.print(getOrchestration(c));
        
        
        
    }
    
}
