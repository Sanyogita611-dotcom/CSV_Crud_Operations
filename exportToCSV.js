const sql = require('mssql');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// SQL Server configuration
const config = {
    user: 'sa',
    password: 'Admin@123',
    server: '192.168.2.58',
    database: 'CSVUpload',
    port: 1433,
    connectionTimeout: 60000,
    requestTimeout: 60000,
    options: {
        encrypt: false,
    },
};

// Create a connection pool
const pool = new sql.ConnectionPool(config);

// Define a query to extract data from SQL Server
const query = 'SELECT * FROM CSV'; // Replace with your table name

// CSV Writer configuration
const csvWriter = createCsvWriter({
  path: './CSV/output.csv', // Specify the name of the CSV file
  header: [
    { id: 'DateTime', title: 'DateTime' }, // Replace with your column names
    { id: 'T1', title: 'T1' },
    { id: 'T2', title: 'T2' },
    { id: 'T3', title: 'T3' }
    // Add more columns as needed
  ],
});

(async () => {
  try {
    // Connect to SQL Server
    await pool.connect();

    // Execute the SQL query
    const result = await pool.request().query(query);

    // Extract the data from the query result
    const data = result.recordset;

    // Write data to CSV file
    await csvWriter.writeRecords(data);

    console.log('Data exported to CSV successfully.');

    // Close the connection pool
    await pool.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
