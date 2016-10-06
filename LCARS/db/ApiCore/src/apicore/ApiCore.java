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
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);           
        }
        
        return responseRecipes;
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
        } catch (Exception e) {
            System.err.println(e.getClass().getName() + ": " + e.getMessage());
            System.exit(0);           
        }
        
        return profiles;
    }
    
    /**
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
        System.out.println();
        System.out.print(getProfiles(c));
        System.out.println();
        System.out.print(getResponseRecipes(c));
        
        
    }
    
}
