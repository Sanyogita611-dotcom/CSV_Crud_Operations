const express = require('express')
const bodyparser = require('body-parser')
const fs = require('fs');
const path = require('path')
// const Pool = require("pg").Pool;
const { Pool } = require('pg');
const multer = require('multer')
const csv = require('fast-csv');
const sql = require('mssql');
const app = express()

 
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))
 
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
 
pool.connect(function (err) {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to database.');
  
})
 
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')    
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({
    storage: storage
});
 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
 
app.post('/import-csv', upload.single("import-csv"), (req, res) =>{
    uploadCsv(__dirname + '/uploads/' + req.file.filename);
    
    console.log('File has imported :' + err);
});
 
// function uploadCsv(uriFile){
    
//     let stream = fs.createReadStream(uriFile);
//     let csvDataColl = [];
//     let fileStream = csv
//         .parse()
//         .on("data", function (data) {
          
//             csvDataColl.push(data);

//         })
//         .on("end", function () {
//             csvDataColl.shift();
  
//             pool.connect((error) => {
//                 if (error) {
//                     console.error(error);
//                 } else {
//                     let query = "Insert into \"cronjob\"(\"DateTime\",\"T1\",\"T2\",\"T3\") VALUES($1, $2, $3, $4) ";
//                     pool.query(query, [csvDataColl], (error, res) => {
//                         console.log(error || res);
//                     }).then(...)
//                     // pool.query({ 
//                     //     text: 'INSERT INTO goods (id, name) VALUES ($1, $2)', 
//                     //     values: [1, 'milk']
//                     //  }).then(...)
//                 }
//             });
             
//             fs.unlinkSync(uriFile)
//         });
  
//     stream.pipe(fileStream);
// }

// A function that uploads CSV data to the database
async function uploadCsv(uriFile) {
    const stream = fs.createReadStream(path.resolve(__dirname, uriFile));
    const csvDataColl = [];
  
    const fileStream = stream.pipe(csv.parse());
  
    fileStream.on('data', (data) => {
      csvDataColl.push(data);
    });
  
    fileStream.on('end', async () => {
      csvDataColl.shift();
  
      try {
        await pool.connect();
        const query =
          'INSERT INTO [dbo].[CSV] (DateTime, T1, T2, T3) VALUES (0, 1, 2, 3)';
          const insertPromises = csvDataColl.map((rowData) => pool.query(query, rowData));
           await Promise.all(insertPromises);
        // await pool.query(query,...csvDataColl);
  
        console.log('Successfully inserted data');
      } catch (error) {
        console.error('Failed to insert data: ', error);
      } finally {
        fs.unlink(path.resolve(__dirname, uriFile), (err) => {
          if (err) throw err;
          console.log('File deletion complete.');
        });
      }
    });
  }
  
//   uploadCsv('./path/to/your/file.csv');
 
const PORT = process.env.PORT || 5555
app.listen(PORT, () => console.log(`Node app serving on port: ${PORT}`));

// const express = require('express');
// const multer = require('multer');
// const csvParser = require('csv-parser');
// const sql = require('mssql');

// const app = express();
// const port = 3000;

// // Configure Multer for file upload
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

// // SQL Server database configuration
// const config = {
//     user: 'sa',
//     password: 'Admin@123',
//     server: '192.168.2.58',
//     database: 'CSVUpload',
//     port: 1433,
//     connectionTimeout: 60000,
//     requestTimeout: 60000,
//     options: {
//         encrypt: false,
//     },
// };

// // Create a connection pool
// const pool = new sql.ConnectionPool(config);
// const poolConnect = pool.connect();

// poolConnect.then((pool) => {
//     console.log('Connected to SQL Server database');
// }).catch((err) => {
//     console.error('Database connection error:', err);
// });

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

// // Handle file upload

// // app.post('/upload', upload.single('csvFile'), (req, res) => {
// //     const csvData = req.file.buffer.toString('utf8');

// //     // Parse CSV data
// //     csvParser({ separator: ',' })
// //         .on('data', (row) => {
// //             // Insert each row into the database
// //             poolConnect.then(() => {
// //                 const request = pool.request();

// //                 // Corrected SQL query
// //                 request.query('INSERT INTO [dbo].[CSV] (DateTime, T1, T2, T3) VALUES (@DateTime, @T1, @T2, @T3)', {
// //                     DateTime: row.DateTime,
// //                     T1: row.T1,
// //                     T2: row.T2,
// //                     T3: row.T3
// //                 }, (err) => {
// //                     if (err) {
// //                         console.error('Error inserting data:', err);
// //                     }
// //                 });
// //             });
// //         })
// //         .on('end', () => {
// //             res.send('CSV file uploaded and data inserted into the database');
// //         })
// //         .write(csvData);
// // });


// // app.post('/upload', upload.single('csvFile'), (req, res) => {
// //     const csvData = req.file.buffer.toString('utf8');

// //     // Parse CSV data
// //     csvParser({ separator: ',' })
// //         .on('data', (row) => {
// //             // Insert each row into the database
// //             poolConnect.then(() => {
// //                 const request = pool.request();

// //                 // INSERT INTO [dbo].[CSV] (DateTime, T1, T2, T3) VALUES (@DateTime, @T1, @T2, @T3)
// //                 request.query('INSERT INTO [dbo].[CSV] (DateTime, T1, T2, T3) VALUES (@DateTime, @T1, @T2, @T3))', {
// //                     DateTime: row.DateTime,
// //                     T1: row.T1,
// //                     T2: row.T2,
// //                     T3: row.T3
// //                 }, (err) => {
// //                     if (err) {
// //                         console.error('Error inserting data:', err);
// //                     }
// //                 });
// //             });
// //         })
// //         .on('end', () => {
// //             res.send('CSV file uploaded and data inserted into the database');
// //         })
// //         .write(csvData);
// // });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });
