const fs = require("fs");
const csv = require("csv-parser");

const csvFilePath = "members.csv"; // Update with your CSV file path
const jsonFilePath = "members.json"; // Path to save the generated JSON file

const members = [];

fs.createReadStream(csvFilePath)
  .pipe(
    csv({
      headers: [
        "Last Name",
        "First\nName",
        "Email",
        "T-shirt owed?",
        "T SHIRT (OR TOTE) RECEIVED",
        "Shirt Size",
        "New Member Gift Status",
        "Special letter owed",
        "Type",
        "Status",
        "MemberStatus",
        "Mailchimp Subscription confirmed",
        "Interest in volunteering",
        "Volunteering comments (skills, availability)",
        "Unnamed: 14",
        "Unnamed: 15",
        "Member\nSince",
        "Membership \nExpires",
        "REMINDER EMAIL SENT?",
        "2022-23 Membership Paid",
        "2023-23 Added Donation Amount",
        "2022-23 Payment Date",
        "Address",
        "City\nProvince",
        "Postal \nCode",
        "Primary\nTelephone",
        "Most recent\npymt method\nip - ol - sub",
        "Notes",
        "Unnamed: 28",
        "DonationAmount_2014",
        "2022 Membership paid ($30)",
        "2022 Added Donation Amount",
        "2022 Payment Date",
        "Unnamed: 33",
        "Unnamed: 34",
        "Unnamed: 35",
        "Unnamed: 36",
        "Unnamed: 37",
        "Unnamed: 38",
      ],
      skipLines: 1, // Skipping the first row
    })
  )
  .on("data", (row) => {
    if (!row["Last Name"] || !row["First\nName"]) {
      return; // Skip rows that do not have valid member data
    }

    let city = "";
    let province = "";
    if (row["City\nProvince"]) {
      [city, province] = row["City\nProvince"]
        .split(",")
        .map((item) => item.trim());
    }

    // Debug logging
    //     console.log("Row:", row);

    const member = {
      firstName: row["First\nName"] || "",
      lastName: row["Last Name"] || "",
      email: row["Email"] || "",
      phone: row["Primary\nTelephone"] || "",
      membership: {
        type: row["Type"] || "",
        status: row["Status"] || "",
        startDate: row["Member\nSince"] ? new Date(row["Member\nSince"]) : null,
        endDate: row["Membership \nExpires"]
          ? new Date(row["Membership \nExpires"])
          : null,
      },
      address: {
        street: row["Address"] || "",
        city: city,
        province: province,
        postalCode: row["Postal \nCode"] || "",
      },
      notes: row["Notes"] || "",
    };

    // Debug logging
    //     console.log("Member:", member);

    members.push(member);
  })
  .on("end", () => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(members, null, 2));
    //     console.log(`JSON file successfully generated at ${jsonFilePath}`);
  });
