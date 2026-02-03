import { APPOINTMENT_URL, LOCATION_MAP, AnalysisSchema, AppointmentSchema } from "./constants.js";
import { JSDOM } from "jsdom";

export async function scrapeForAppointments() {
    try {
        const response = await fetch(APPOINTMENT_URL);
        const html = await response.text();
        
        // read dummy html from local file for testing
        //const fs = await import("fs/promises");
        //const html = await fs.readFile("./utils/test.html", "utf-8");
        

        // Create a DOM from HTML
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Narrow scope to the reservation table
        const table = doc.querySelector(".time--table");

        if (!table) {
            console.error("Reservation table not found");
            return [];
        }
        
        // Select only enabled appointment cells
        const enabledCells = table.querySelectorAll("td.tdSelect.enable");

        const appointments = [];

        enabledCells.forEach(td => {
            const onclick = td.getAttribute("onclick");

            // Example: selectDate("FC00079","20260402","1",this);
            const match = onclick.match(
            /selectDate\("(.+?)", "(\d{8})", "(\d+)"/
            );

            if (!match) {
                console.warn("Could not parse onclick:", onclick);
                return;
            } 

            const [, facilityCode, date, type] = match;
            // Convert date from YYYYMMDD to YYYY-MM-DD
            const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

            const appointment = AppointmentSchema.parse({
                location: LOCATION_MAP[facilityCode],
                is29Country: true,
                date: formattedDate,
                type: "29の国･地域の方", // Since only enabled cells are for 29-country appointments
            });

            appointments.push(appointment);
        });

        const parsed = AnalysisSchema.safeParse(appointments);
        return parsed.success ? parsed.data : [];
    } catch (error) {
        console.error("Scraping failed:", error.message);
        return [];
    }
}
