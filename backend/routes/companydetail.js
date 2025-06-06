// routes/companydetail.js
import express from 'express';
import { sendCompanyDetailsEmail } from '../utils/sendEmail.js'; // Import the email sending utility

// This module exports a function that accepts the Supabase client as an argument.
// This design pattern allows you to inject dependencies (like 'supabase') into your routes.
export default (supabase) => {
  const router = express.Router(); // Create a new Express router instance

  // --- POST Route: Save Company Details to Supabase and Send Email ---
  router.post("/", async (req, res) => {
    console.log("------------------------------------------");
    console.log("Received POST request to /api/companydetail");
    console.log("Request Body:", req.body); // Log the entire incoming request body

    // Destructure required fields from the request body
    const {
      firstName,
      lastName,
      companyEmail,
      companyName,
      designation,
      selectedProduct,
      currentSpend,
      savingsLow,
      savingsHigh,
    } = req.body;

    // --- Input Validation ---
    // Check for the presence of all mandatory fields.
    // For numbers, explicitly check against `undefined` or `null` as 0 is a valid value.
    if (
      !firstName || !lastName || !companyEmail || !companyName ||
      !designation || !selectedProduct ||
      currentSpend === undefined || savingsLow === undefined || savingsHigh === undefined
    ) {
      console.error("Validation Error: One or more required fields are missing or undefined in the request body.");
      return res.status(400).json({ error: "All fields are required and must be valid." });
    }

    // Convert string numeric inputs to actual numbers and validate them
    const parsedCurrentSpend = Number(currentSpend);
    const parsedSavingsLow = Number(savingsLow);
    const parsedSavingsHigh = Number(savingsHigh);

    if (isNaN(parsedCurrentSpend) || isNaN(parsedSavingsLow) || isNaN(parsedSavingsHigh)) {
      console.error("Validation Error: 'currentSpend', 'savingsLow', or 'savingsHigh' are not valid numbers.");
      return res.status(400).json({ error: "Spend and savings values must be valid numbers." });
    }

    console.log("Parsed numeric values for database insertion:");
    console.log(`  currentSpend: ${parsedCurrentSpend}`);
    console.log(`  savingsLow: ${parsedSavingsLow}`);
    console.log(`  savingsHigh: ${parsedSavingsHigh}`);

    try {
      // --- Supabase Database Insertion ---
      // Prepare the data object for insertion into the 'company_details' table.
      // Ensure key names (e.g., 'first_name') precisely match your Supabase table's column names.
      const insertData = {
        first_name: firstName,
        last_name: lastName,
        company_email: companyEmail,
        company_name: companyName,
        designation: designation,
        selected_product: selectedProduct,
        current_spend: parsedCurrentSpend,
        savings_low: parsedSavingsLow,
        savings_high: parsedSavingsHigh,
        // The 'created_at' column in Supabase usually has a DEFAULT now()
        // so it doesn't need to be explicitly included here.
      };

      console.log("Attempting to insert data into 'company_details' table:", insertData);

      // Perform the insertion using the Supabase client
      const { data, error } = await supabase
        .from('company_details') // Specify the target table
        .insert([insertData])    // Provide the data to insert (as an array of objects)
        .select();               // Request the inserted data back

      if (error) {
        // Log Supabase-specific errors for debugging
        console.error("Supabase Insertion Error:", error);
        // Handle unique constraint violation (e.g., if company_email must be unique)
        if (error.code === '23505') { // PostgreSQL error code for unique_violation
            return res.status(409).json({ error: `A record with this company email '${companyEmail}' already exists.` });
        }
        // Generic error for other database-related issues
        return res.status(500).json({ error: `Failed to save company detail to database. Supabase error details: ${error.message}` });
      }

      console.log("Supabase Insert Success. Response Data:", data);

      // --- Email Sending Logic ---
      // Get recipient emails and the public logo URL from environment variables
      const recipientEmails = process.env.COMPANY_DETAILS_RECIPIENTS;
      const emailLogoUrl = process.env.EMAIL_LOGO_PUBLIC_URL; // Public URL from Cloudinary (or other CDN)

      if (recipientEmails) {
        // Mapping product IDs to more readable names for the email
        const productMapping = {
            "google-workspace": "Google Workspace",
            "microsoft-office": "Microsoft Office",
            "udemy": "Udemy",
            "atlassian": "Atlassian",
        };
        const productName = productMapping[selectedProduct] || selectedProduct; // Use mapped name or original ID

        const emailSubject = `SaaS Savings Calculation from ${companyName}`;
        const emailHtmlContent = `
          <html>
          <body style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
              ${emailLogoUrl ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${emailLogoUrl}" alt="Revynox Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto;"></div>` : ''}
              
              <h2 style="color: #6a0dad; text-align: center; font-size: 24px; margin-top: 10px; margin-bottom: 5px;">New SaaS Savings Calculation</h2>
                 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

              <h3 style="color: #6a0dad; font-size: 18px; margin-bottom: 10px;">Contact Person Details:</h3>
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Name:</strong> ${firstName} ${lastName}</li>
                <li style="margin-bottom: 8px;"><strong>Company:</strong> ${companyName}</li>
                <li style="margin-bottom: 8px;"><strong>Designation:</strong> ${designation}</li>
                <li style="margin-bottom: 8px;"><strong>Email:</strong> <a href="mailto:${companyEmail}" style="color: #007bff; text-decoration: none;">${companyEmail}</a></li>
              </ul>

              <h3 style="color: #6a0dad; font-size: 18px; margin-top: 20px; margin-bottom: 10px;">Savings Details:</h3>
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Selected Product:</strong> ${productName}</li>
                <li style="margin-bottom: 8px;"><strong>Current Monthly Spend:</strong> <span style="font-weight: bold; color: #333;">$${parsedCurrentSpend.toLocaleString()}</span></li>
                <li style="margin-bottom: 8px;"><strong>Potential Monthly Savings (Low Estimate):</strong> <span style="font-weight: bold; color: #28a745;">$${parsedSavingsLow.toLocaleString()}</span></li>
                <li style="margin-bottom: 8px;"><strong>Potential Monthly Savings (High Estimate):</strong> <span style="font-weight: bold; color: #007bff;">$${parsedSavingsHigh.toLocaleString()}</span></li>
              </ul>

              <p style="text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
                This email was automatically generated by the Revynox SaaS Savings Calculator.
              </p>
            </div>
          </body>
          </html>
        `;

        try {
          // Attempt to send the email
          await sendCompanyDetailsEmail({
            to: recipientEmails,
            subject: emailSubject,
            htmlContent: emailHtmlContent,
          });
          console.log(`Company details email successfully dispatched to ${recipientEmails}.`);
        } catch (emailError) {
          // Log email sending failures, but don't prevent a 201 response if DB save was successful
          console.error(`Failed to send company details email: ${emailError.message}`);
          // You might choose to return a 500 here if email sending is absolutely critical
          // For now, it will proceed with the 201 response if DB insertion succeeded.
        }
      } else {
        console.warn("COMPANY_DETAILS_RECIPIENTS not set in .env. Skipping email sending.");
      }
      // --- End Email Sending Logic ---

      console.log("------------------------------------------");
      // Send a 201 Created response for successful data saving and email dispatch attempt
      return res.status(201).json({ message: "Company details saved and email sent successfully." });

    } catch (backendError) {
      // Catch any unexpected errors that occur during the entire POST request processing
      console.error("Caught unexpected backend error during POST /api/companydetail:", backendError);
      return res.status(500).json({ error: "An unexpected internal server error occurred." });
    }
  });

  // --- GET Route: Retrieve All Company Details from Supabase ---
  router.get("/", async (req, res) => {
    console.log("------------------------------------------");
    console.log("Received GET request to /api/companydetail");
    try {
      // Fetch all records from the 'company_details' table
      const { data, error } = await supabase
        .from('company_details') // Specify the target table
        .select('*');            // Select all columns

      if (error) {
        // Log Supabase-specific errors for debugging
        console.error("Supabase Fetch Error:", error);
        return res.status(500).json({ error: `Failed to fetch company details from database. Supabase error details: ${error.message}` });
      }

      console.log("Supabase Fetch Success. Data retrieved:", data.length, "records.");
      console.log("------------------------------------------");
      res.json(data); // Send the retrieved data as a JSON response
    } catch (backendError) {
      // Catch any unexpected errors that occur during the entire GET request processing
      console.error("Caught unexpected backend error during GET /api/companydetail:", backendError);
      return res.status(500).json({ error: "An unexpected internal server error occurred during data retrieval." });
    }
  });

  return router; // Return the configured router instance
};
