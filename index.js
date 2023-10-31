const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sql = require('mssql'); // Import the mssql library for SQL Server
const fs = require('fs');
const csv = require('csv-parser');
const app = express();

app.use(express.static(path.join(__dirname, 'src/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Database connection configuration
const dbConfig = {
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

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();
pool.connect()
    .then(() => {
        console.log('Connected to SQL Server database.');
    })
    .catch((err) => {
        console.error('Database connection error: ', err);
    });

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads/');
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/import-csv', upload.single('import-csv'), (req, res) => {
    const filePath = __dirname + '/uploads/' + req.file.filename;
    uploadCsv(filePath)
        .then(() => {
            console.log('File has been imported successfully.');
            res.status(200).send('File has been imported successfully.');
        })
        .catch((err) => {
            console.error('Error importing file:', err);
            res.status(500).send('Error importing file: ' + err.message);
        });
});

// Example function to validate and format a date string
function validateAndFormatDate(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        // The date is valid, format it as 'YYYY-MM-DD HH:mm:ss'
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } else {
        // Invalid date, handle the error or return a default value
        return null;
    }
}

async function uploadCsv(filePath) {
    try {
        const csvDataColl = []; // This will hold your CSV data

        // Read and parse the CSV file
        const fileStream = fs.createReadStream(filePath).pipe(csv());
        fileStream.on('error', (err) => {
            console.error('Error reading the CSV file:', err);
          });

          

          fileStream.on('data', (data) => {
            console.log(data);
            // Assuming your CSV file has columns DateTime, T1, T2, T3
            // Adjust these property names according to your CSV file structure
            const rowData = {
                empid: data.empid,
                Name: data.Name,
                Department: data.Department,
                Email: data.Email,
                salary: data.salary,
                phoneno: data.phoneno
            };

            csvDataColl.push(rowData);
          });

          fileStream.on('end', async () => {
            // const query =
            //   'INSERT INTO [dbo].[CSV] (DateTime, T1, T2, T3) VALUES (@DateTime, @T1, @T2, @T3)';
            const request = pool.request();

            for (const rowData of csvDataColl) {
            //   await request
            //     .input('DateTime', sql.VarChar, rowData.DateTime)
            //     .input('T1', sql.VarChar, rowData.T1)
            //     .input('T2', sql.VarChar, rowData.T2)
            //     .input('T3', sql.VarChar, rowData.T3)
            //     .query(query);

            await request.query(`INSERT INTO [Employee]([empid] ,[Name],[Department],[Email],[salary],[phoneno]) VALUES ( '${rowData.empid}', '${rowData.Name}', '${rowData.Department}', '${rowData.Email}', '${rowData.salary}', '${rowData.phoneno}')`);

            }
       
            console.log('Data from CSV file inserted successfully.');
            
          });

       


        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}
 
async function fetchDataFromDatabase() {
    try {
      const request = pool.request();
      const result = await request.query('SELECT * FROM Employee');
      return result.recordset; // Assuming 'Employee' is the name of your table
    } catch (error) {
      throw error;
    }
  }

  
app.get('/fetch-data', async (req, res) => {
    try {
      const data = await fetchDataFromDatabase();
      res.json(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });

// Create a route to handle adding a new employee

app.post('/add-employee', async (req, res) => {
    try {
      await poolConnect; // Wait for the connection pool to be initialized
  
      const { empid, Name, Department, Email, salary, phoneno } = req.body;
      const request = new sql.Request(pool);
  
      // Use parameters in your SQL query to prevent SQL Injection
      const query = `
        INSERT INTO [Employee] ([empid], [Name], [Department], [Email], [salary], [phoneno])
        VALUES (@empid, @name, @department, @email, @salary, @phoneno)
      `;
  
      await request
        .input('empid', sql.Int, empid)
        .input('name', sql.VarChar(50), Name)
        .input('department', sql.VarChar(50), Department)
        .input('email', sql.VarChar(50), Email)
        .input('salary', sql.Numeric, salary)
        .input('phoneno', sql.Numeric, phoneno)
        .query(query);
  
      res.status(200).send('Employee added successfully');
    } catch (error) {
      console.error('Error adding employee:', error);
      res.status(500).send('Error adding employee: ' + error.message);
    }
  });


app.post('/update-employee', async (req, res) => {
  try {
    await poolConnect; // Wait for the connection pool to be initialized

    const { updateempid, updateName, updateDepartment, updateEmail, updatesalary, updatephoneno } = req.body;
    const request = new sql.Request(pool);

    // Use parameters in your SQL query to prevent SQL Injection
    const query = `
     Update Employee SET [Name] = @name ,[Department]=@department,[Email] = @email ,[salary]=@salary,[phoneno] =@phoneno  where [empid] = @empid
    `;
      
    // INSERT INTO [Employee] ([empid], [Name], [Department], [Email], [salary], [phoneno])
    // VALUES (@empid, @name, @department, @email, @salary, @phoneno)
    await request
      .input('empid', sql.Int, updateempid)
      .input('name', sql.VarChar(50), updateName)
      .input('department', sql.VarChar(50), updateDepartment)
      .input('email', sql.VarChar(50), updateEmail)
      .input('salary', sql.Numeric, updatesalary)
      .input('phoneno', sql.Numeric, updatephoneno)
      .query(query);

    res.status(200).send('Employee added successfully');
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).send('Error adding employee: ' + error.message);
  }
});

app.post('/delete-employee', async (req, res) => {
  try {
    await poolConnect; // Wait for the connection pool to be initialized

    const { deleteempid} = req.body;
    const request = new sql.Request(pool);

    // Use parameters in your SQL query to prevent SQL Injection
    const query = `
     Delete From Employee where [empid] = @empid
    `;
      
    // INSERT INTO [Employee] ([empid], [Name], [Department], [Email], [salary], [phoneno])
    // VALUES (@empid, @name, @department, @email, @salary, @phoneno)
    await request
      .input('empid', sql.Int, deleteempid)
      .query(query);

    res.status(200).send('Employee added successfully');
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).send('Error adding employee: ' + error.message);
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});





