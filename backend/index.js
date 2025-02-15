const express = require("express")
const mysql = require('mysql')
const cors = require("cors");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Ensure this line is added


const app = express()

app.use(express.json())
app.use(bodyParser.json());
app.use(cookieParser());


const port = 2001

// const pool = mysql.createPool({
//   connectionLimit: 20,
//   host: 'localhost',
//   user: 'dvrhealth',
//   password: 'dvrhealth',
//   database: 'esurv'
// })

const pool = mysql.createPool({
  connectionLimit: 20,
  /// host: '103.141.218.138',
  host: '192.168.100.220',
  user: 'dvrhealth',
  password: 'dvrhealth',
  database: 'esurv'
})

pool.on('connection', (connection) => {
  console.log('New connection acquired');
});


pool.on('release', (connection) => {
  console.log('Connection released');
});


function handleDisconnect(pool) {
  pool.on('error', (err) => {
    console.error('MySQL pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting to reconnect to MySQL...');
      handleDisconnect(mysql.createPool(dbConfig));
    } else {
      throw err;
    }
  });
}

handleDisconnect(pool);

// app.use(cors({
//   origin: 'http://localhost:5173'
// }));

app.use(cors({
  // origin: 'http://103.141.218.138:5173'
}));

// var allowlist = ['http://192.168.100.220:5173', 'http://103.141.218.138:5173']
// var corsOptionsDelegate = function (req, callback) {
//   var corsOptions;
//   if (allowlist.indexOf(req.header('Origin')) !== -1) {
//     corsOptions = { origin: true } 
//   } else {
//     corsOptions = { origin: false } 
//   }
//   callback(null, corsOptions) 
// }

const corsOptions = {
  credentials: true,
  // origin: ['http://103.141.218.138:5173', 'http://192.168.100.220:5173'],// Whitelist the domains you want to allow

};

// Enable CORS with specific origin
// app.use(cors({
//   origin: 'http://103.141.218.138:5173'
// }));

app.use(cors(corsOptions));


const fs = require('fs-extra');
const path = require('path');
const archiver = require("archiver");



// Helper function to zip a folder
const zipFolder = (sourceFolder, zipFilePath) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(zipFilePath));
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    archive.finalize();
  });
};

// API endpoint to start zipping a folder
app.get('/start-zip/:folder', async (req, res) => {
  try {
    const folderName = req.params.folder;
    const sourceFolder = path.join('D:', 'site_images', folderName); // Adjust path as needed
    const zipDir = path.join(__dirname, 'zips', 'zips');

    // Ensure the source folder exists
    if (!fs.existsSync(sourceFolder)) {
      return res.status(404).json({ error: 'Source folder not found.' });
    }

    // Ensure the zip directory exists
    await fs.ensureDir(zipDir);

    const zipFilePath = path.join(zipDir, `${folderName}.zip`);

    // Zip the folder
    await zipFolder(sourceFolder, zipFilePath);

    // Respond with the zip file path
    const downloadUrl = `/zips/zips/${folderName}.zip`;
    res.status(200).json({ zipPath: downloadUrl });
  } catch (err) {
    console.error('Error zipping folder:', err);
    res.status(500).json({ error: 'Failed to zip folder.' });
  }
});




app.get('/get-folders', async (req, res) => {
  try {
    // Define the destination base folder
    const destFolder = path.join(__dirname, 'public');

    // Read the list of items in the 'public' directory
    const items = await fs.readdir(destFolder);

    // Filter out non-directories and only keep folder names
    const folders = items.filter(item => fs.statSync(path.join(destFolder, item)).isDirectory());

    // Send the folder names as the response
    res.status(200).json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching folder names.');
  }
});



app.get('/download/public/:date/:atmId.jpg', (req, res) => {
  const { date, atmId } = req.params;
  
  // Construct the file path based on the date and ATMID
  const filePath = path.join(__dirname, 'public', date, `${atmId}.jpg`);

  // Check if file exists (you can improve this check by using fs.existsSync or similar)
  res.sendFile(filePath, {
    headers: {
      'Content-Disposition': 'attachment; filename=' + `${atmId}.jpg`, // Force download with a specific filename
    }
  }, (err) => {
    if (err) {
      res.status(404).send('Image not found');
    }
  });
});



app.use('/public', express.static(path.join(__dirname, 'public')));

app.use('/zips', express.static(path.join(__dirname, 'zips')));

app.get('/', (req, res) => {
  res.send('Node.js Static File Server');
});

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utility function to get the dates for the last 5 days
function getLast5Dates() {
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i); // Set to current date - i days
    const formattedDate = getCurrentDateFromDate(date);
    dates.push(formattedDate);
  }
  return dates.reverse(); // To get the current date first
}

function getCurrentDateFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

app.get('/copy-folder', async (req, res) => {
  try {
    // Get the last 5 dates (current date and the previous 4 days)
    const dateRange = getLast5Dates();

    // Define the base source folder
    const baseSourceFolder = 'D:/site_images';

    // Define the destination base folder
    const destFolder = path.join(__dirname, 'public');

    // Loop over each of the last 5 dates
    for (const currentDate of dateRange) {
      const sourceFolder = path.join(baseSourceFolder, currentDate);
      const destFolderForDate = path.join(destFolder, currentDate);

      // Check if the source folder exists
      if (fs.existsSync(sourceFolder)) {
        // Check if the destination folder exists, if not create it
        if (!fs.existsSync(destFolderForDate)) {
          await fs.mkdir(destFolderForDate, { recursive: true });
        }

        // Read the list of files in the source folder
        const sourceFiles = await fs.readdir(sourceFolder);

        // Iterate through each file in the source folder
        for (const file of sourceFiles) {
          const sourceFilePath = path.join(sourceFolder, file);
          const destFilePath = path.join(destFolderForDate, file);

          // Check if the file exists in the destination folder
          const shouldCopy = !fs.existsSync(destFilePath) || (
            fs.statSync(sourceFilePath).mtime > fs.statSync(destFilePath).mtime
          );

          // Only copy if the file is new or modified
          if (shouldCopy) {
            await fs.copyFile(sourceFilePath, destFilePath);
          }
        }
      }
    }

    // Ensure there are no more than 5 folders in the 'public' directory
    const publicFolders = await fs.readdir(destFolder);
    const sortedFolders = publicFolders.filter(folder => fs.statSync(path.join(destFolder, folder)).isDirectory())
                                      .sort((a, b) => {
                                        const aDate = new Date(a);
                                        const bDate = new Date(b);
                                        return bDate - aDate;
                                      });

    if (sortedFolders.length > 5) {
      const foldersToDelete = sortedFolders.slice(5); // Get the oldest folders
      for (const folder of foldersToDelete) {
        const folderPath = path.join(destFolder, folder);
        await fs.rmdir(folderPath, { recursive: true });
      }
    }

    // Send success response
    res.status(200).send('Folder copy completed successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error copying folder.');
  }
});



app.post('/register_api_for_dvr_health', (req, res) => {

  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = 'INSERT INTO registered_users (username,password ) VALUES (?,?)';

  pool.query(sql, [username, hashedPassword], (err) => {
    if (err) {
      console.log("error registering user", err)
      res.status(500).json({ error: "Internal server error" })
    }
    else {
      console.log("User Registered Successfully")
      res.status(200).json({ message: "Registered successfully" });
    }
  })


})

const secretKey = crypto.randomBytes(32).toString('hex');

app.post('/login_user_api_prev', (req, res) => {
  const { username, password } = req.body;
  console.log('Received login request for username:', username); // Log the received username

  pool.query('SELECT * FROM registered_users WHERE username = ?', [username], (error, results) => {
    if (error) {

      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ username: user.username, userId: user.id }, secretKey, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true });
      res.status(200).json({ message: 'Login successful' });
    });
  });
});

app.post('/login_user_api', (req, res) => {
  const { username, password } = req.body;
  console.log('Received login request for username:', username); // Log the received username
  res.set('Access-Control-Allow-Origin', '*');
  // Allow requests from all origins
  app.use(cors());
  res.set('Access-Control-Request-Private-Network', true);
  res.set('Access-Control-Allow-Private-Network', true);
  pool.query('SELECT * FROM registered_users WHERE username = ? AND password = ?', [username, password], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Internal server error' + error  });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    res.status(200).json({ message: 'Login successful' });
  });
});

app.post('/refresh_device_api', (req, res) => {
  const { ip, dvr_name } = req.body;

  pool.query('SELECT * FROM ips_refresh_status WHERE ipaddress = ? AND dvrname = ? AND status = 0', [ip, dvr_name], (error, results) => {
    if (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      const sql = 'INSERT INTO ips_refresh_status (ipaddress,dvrname ) VALUES (?,?)';

      pool.query(sql, [ip, dvr_name], (err) => {
        if (err) {
          console.log("error inserting", err)
          res.status(202).json({ error: "Insert error" })
        }
        else {
          console.log("Inserted Successfully")
          res.status(201).json({ message: "Inserted successfully" });
        }
      })
    } else {
      const user = results[0];
      if (user.status == 1) {
        res.status(200).json({ message: 'successful' });
      } else {
        res.status(203).json({ message: 'successful' });
      }
    }
  });
});

app.get('/allsites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT
        d.atmid,
        d.ip,
        d.cam1,
        d.cam2,
        d.cam3,
        d.cam4,
        DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
        d.latency,
        CASE
        WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
        ELSE 'not available'
    END AS recording_to_status,
        DATE_FORMAT(d.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,
        DATE_FORMAT(d.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
        d.dvrtype,
        CASE
        WHEN d.hdd = 'ok' THEN 'working'
        ELSE 'not working'
    END AS hdd_status,
    CASE
        WHEN d.login_status = 0 THEN 'working'
        ELSE 'not working'
    END AS login_status,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        s.Bank,
        s.Customer,
        s.City,
        s.State,
        s.SiteAddress,
        s.Zone
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
      WHERE
        s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
      WHERE
        s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;


  const countOnlineQuery = `
      SELECT COUNT(*) as count
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
      WHERE
        s.live = 'Y' AND d.status = 1 AND d.login_status = 0
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  const countOfflineQuery = `
      SELECT COUNT(*) as count
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
      WHERE
        s.live = 'Y' AND (d.status = 0 AND d.login_status = 0) OR (d.status = 0 AND d.login_status = 1) OR (d.status = 1 AND d.login_status = 1)
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      pool.query(countOnlineQuery, (countOnlineError, countOnlineResults) => {
        if (countOnlineError) throw countOnlineError;

        const totalOnlineCount = countOnlineResults[0].count;

        res.json({
          data: results,
          totalCount,
          totalOnlineCount
        });

      });
    });
  });
});

app.get('/allsitesexport_api', (req, res) => {
  const { atmid } = req.query;

  let query = `
      SELECT
        d.atmid,
        d.ip,
        d.cam1,
        d.cam2,
        d.cam3,
        d.cam4,
        DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
        d.latency,
        CASE
        WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
        ELSE 'not available'
    END AS recording_to_status,
        DATE_FORMAT(d.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,
        DATE_FORMAT(d.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
        d.dvrtype,
        CASE
        WHEN d.hdd = 'ok' THEN 'working'
        ELSE 'not working'
    END AS hdd_status,
    CASE
        WHEN d.login_status = 0 THEN 'working'
        ELSE 'not working'
    END AS login_status,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        s.Bank,
        s.Customer,
        s.City,
        s.State,
        s.SiteAddress,
        s.Zone
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
      WHERE
        s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
      WHERE
        s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});



app.get('/fetch_status_customer_wise', (req, res) => {
  let query = `
    SELECT 
        d.customer, 
        COUNT(*) AS total, 
        SUM(CASE 
          WHEN d.status = 1 THEN 1
          ELSE 0 
        END) AS total_online_network,
        SUM(CASE 
          WHEN d.status = 0 THEN 1
          ELSE 0 
        END) AS total_offline_network,
        SUM(CASE 
                WHEN d.login_status = 0 AND d.status = 1 THEN 1
                ELSE 0 
            END) AS total_online_dvr,
        SUM(CASE 
              WHEN d.login_status = 1 AND d.status = 1 THEN 1
              ELSE 0 
        END) AS total_dvr_notlogin, 
        SUM(CASE 
              WHEN d.login_status = 1 THEN 1
              ELSE 0 
        END) AS total_offline_dvr,  
        SUM(CASE 
              WHEN d.login_status IS NULL THEN 1
              ELSE 0 
        END) AS total_never_on, 
        SUM(CASE 
              WHEN (d.hdd = 'Error' OR d.hdd = 'Not Exist' OR d.hdd = 'notexist' OR d.hdd = 'abnormal' OR d.hdd = 'unformatted' OR d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk' OR d.hdd = '1') THEN 1
              ELSE 0 
        END) AS total_hdd_notworking,         
        SUM(CASE 
              WHEN (d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk') THEN 1
              ELSE 0 
        END) AS total_hdd_noDisk,
        SUM(CASE 
              WHEN (d.hdd = 'Not Exist' OR d.hdd = 'notexist') THEN 1
              ELSE 0 
        END) AS total_hdd_notExist, 
        SUM(CASE 
              WHEN (d.hdd = 'Error') THEN 1
              ELSE 0 
        END) AS total_hdd_Error,  
        SUM(CASE 
              WHEN (d.hdd = '1') THEN 1
              ELSE 0 
        END) AS total_hdd_one,
        SUM(CASE 
              WHEN (d.hdd = 'unformatted') THEN 1
              ELSE 0 
        END) AS total_hdd_unformatted,
        SUM(CASE 
              WHEN (d.hdd = 'abnormal') THEN 1
              ELSE 0 
        END) AS total_hdd_abnormal      

    FROM
        all_dvr_live d
    LEFT JOIN
        sites s ON d.IPAddress = s.DVRIP AND s.live = 'Y'
    LEFT JOIN
        dvronline o ON d.IPAddress = o.IPAddress AND o.Status = 'Y'
    LEFT JOIN
        dvrsite ds ON d.IPAddress = ds.DVRIP AND ds.live = 'Y'
    WHERE
        d.live = 'Y' 
    GROUP BY 
        d.customer;
  `;
  
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query', error);
      return res.status(500).json({ error: 'Database query error' });
    }

    // If you need to run a count query, ensure that countQuery is defined
    // pool.query(countQuery, (countError, countResults) => {
    //   if (countError) {
    //     console.error('Error executing count query', countError);
    //     return res.status(500).json({ error: 'Count query error' });
    //   }
    
    res.json({
      data: results,
    });
    // });
  });
});



app.get('/newallsites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;
  // d.dvr_time IS NOT NULL AND d.login_status=1
  let query = `
  SELECT
  u.unique_code,
  (CASE
    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
    ELSE o.ATMID
  END) AS ATMID,
  d.IPAddress,
  d.dvrname,
  d.cam1,
  d.cam2,
  d.cam3,
  d.cam4,
  (CASE 
     WHEN d.dvr_time IS NOT NULL THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
     ELSE ''
  END) AS time_diff,
  (CASE 
     WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate), 60))
     ELSE ''
  END) AS never_up,
 
  (CASE 
    WHEN ( d.last_communication <  d.cdate ) THEN 
    FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
    ELSE ''
 END) AS down_since,

  d.project,
  DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  
  d.latency,

  (CASE
      WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
      ELSE 'not available'
  END) AS recording_to_status,
  d.recording_to,
  d.recording_from,
  d.dvrname,
  (CASE
      WHEN (d.hdd = 'Yes' OR d.hdd = 'ok') THEN 'working'
      WHEN d.hdd IS NULL THEN 'no record found'
      ELSE 'not working'
  END) AS hdd_status,
  
  (CASE
    WHEN (d.hdd = 'Yes' OR d.hdd = 'ok') THEN 'W'
    WHEN d.hdd IS NULL THEN 'NW'
    ELSE 'NW'
END) AS hdd_db,


  

  (CASE
      WHEN d.login_status = 0 THEN 'working'
      ELSE 'not working'
  END) AS login_status,
  (CASE
      WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
      ELSE 'Offline'
  END) AS dvr_status,
  (CASE
      WHEN d.status = 1 THEN 'Online'
      ELSE 'Offline'
  END) AS ping_status,
  DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time, 
DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
(CASE
WHEN (s.Bank IS NOT NULL) THEN s.Bank
WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
ELSE o.Bank
END) AS Bank,
(CASE
WHEN (s.Customer IS NOT NULL) THEN s.Customer
WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
ELSE o.Customer
END) AS Customer,
(CASE
WHEN (s.City IS NOT NULL) THEN s.City
WHEN (ds.City IS NOT NULL) THEN ds.City
ELSE o.city
END) AS City,
(CASE
  WHEN (s.State IS NOT NULL) THEN s.State
  WHEN (ds.State IS NOT NULL) THEN ds.State
  ELSE o.State
END) AS State,
(CASE
WHEN (s.Zone IS NOT NULL) THEN s.Zone
WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
ELSE o.zone
END) AS Zone,    
(CASE
WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
ELSE o.Address
END) AS SiteAddress,
(CASE
WHEN (s.project IS NOT NULL) THEN s.project
WHEN (ds.project IS NOT NULL) THEN ds.project
ELSE o.project
END) AS project,
'working' AS http_port,
'working' AS rtsp_port,  
'working' AS sdk_port,  
'working' AS ai_port,
sed.eng_name,
sed.eng_contact,
sed.email_id,
IF(
  DATEDIFF(CURDATE(), 
    (CASE
      WHEN d.login_status = 0 THEN 
        (SELECT cdate FROM dvr_history WHERE atmid = d.atmid AND login_status = 0 ORDER BY cdate DESC LIMIT 1)
      ELSE d.last_communication
    END)
  ) = 0, 
  '-', 
  CONCAT(
    DATEDIFF(CURDATE(), 
      (CASE
        WHEN d.login_status = 0 THEN 
          (SELECT cdate FROM dvr_history WHERE atmid = d.atmid AND login_status = 0 ORDER BY cdate DESC LIMIT 1)
        ELSE d.last_communication
      END)
    ), 
  ' days')
) AS network_aging,
d.remarks

FROM

all_dvr_live d
LEFT JOIN
sites s ON d.IPAddress = s.DVRIP AND s.live='Y'
LEFT JOIN
dvronline o ON d.IPAddress = o.IPAddress  AND o.Status='Y'
LEFT JOIN
dvrsite ds ON d.IPAddress = ds.DVRIP   AND ds.live='Y'
LEFT JOIN
site_eng_details sed ON d.IPAddress = sed.IPAddress
LEFT JOIN unique_atm_codes u ON d.atmid = u.atmid

WHERE
  d.live = 'Y' 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
    // query += ` AND (CASE
    //  WHEN (s.ATMID IS NOT NULL) THEN s.ATMID LIKE '%${atmid}%'
    //  WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID LIKE '%${atmid}%'
    //  ELSE o.ATMID LIKE '%${atmid}%'
    //  END)`;
  }

  const countQuery = `
      SELECT COUNT(DISTINCT IPAddress) as count
      FROM
      all_dvr_live d
      WHERE
        d.live = 'Y'
       ${atmid ? ` AND d.atmid LIKE '%${atmid}%'` : ''}
      `;

  const countOnlineQuery = `
      SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
       d.live = 'Y'
      AND d.login_status = 0 AND d.status = 1
        ${atmid ? ` AND d.ATMID LIKE '%${atmid}%'` : ''}
      `;

  const countOfflineQuery = `
      SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
       d.live = 'Y'
      AND d.login_status = 1 AND d.status = 1
        ${atmid ? ` AND d.ATMID LIKE '%${atmid}%'` : ''}
      `;

  query += ` GROUP BY d.IPAddress ORDER BY d.cdate DESC LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      pool.query(countOnlineQuery, (countOnlineError, countOnlineResults) => {
        if (countOnlineError) throw countOnlineError;

        const totalOnlineCount = countOnlineResults[0].count;

        pool.query(countOfflineQuery, (countOffError, countOffResults) => {
          if (countOffError) throw countOffError;

          const totalOfflineCount = countOffResults[0].count;

          res.json({
            data: results,
            totalCount,
            totalOnlineCount,
            totalOfflineCount,
            query
          });

        });

      });


    });
  });
});



// CASE  
// WHEN d.hdd IS NULL THEN 'Not Working'
// WHEN d.hdd = '1' THEN 'Disk Error'
// WHEN d.hdd = '2' THEN '2 HDD'
// WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') 
// AND (
//   STR_TO_DATE(d.recording_to, '%d - %m - %Y') = CURDATE() 
//   OR DATE_FORMAT(d.recording_to, '%Y-%m-%d') = CURDATE()
//   OR STR_TO_DATE(d.recording_to, '%Y- %m- %d') = CURDATE()
// ) 
// THEN 'Working'
// WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') 
// AND (
//   STR_TO_DATE(d.recording_to, '%d - %m - %Y') <> CURDATE() 
//   OR DATE_FORMAT(d.recording_to, '%Y-%m-%d') <> CURDATE()
//   OR STR_TO_DATE(d.recording_to, '%Y- %m- %d') <> CURDATE()
// ) 
// THEN 'STOP'
// WHEN (d.login_status = 1) THEN 'Not Working'
// WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'

// ELSE 'STOP'
// END AS hdd_status




// CASE 
// WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
// WHEN d.hdd IN ('Yes', 'Normal', 'ok') THEN 'Working'
// ELSE 'Not Working'
// END AS 'HDD Status'


app.get('/newallsitesexport_api_newbackup', (req, res) => {
  const { atmid } = req.query;

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        WHEN (d.atmid IS NOT NULL) THEN d.atmid

        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS 'Project',
 

      d.IPAddress as 'IP Address',
      d.dvrname as 'DVR Name',
      


      CASE
            WHEN DATE(d.cdate) = CURDATE() AND (d.login_status = 0) THEN 'Online'
            ELSE 'Offline'
      END AS 'Network Status',
      CASE
      WHEN DATE(d.cdate) = CURDATE() AND d.login_status = 0 THEN
          CASE
              WHEN d.latency = '' THEN '-'
              WHEN d.latency IS NULL THEN '-'
              ELSE d.latency
          END
      ELSE '-'
  END AS 'Latency',
      
      CASE
      WHEN DATE(d.cdate) = CURDATE() AND d.login_status = 0 THEN
            CASE
                WHEN d.status = 1 THEN 'Online'
                ELSE 'Offline'
            END
          ELSE 'Offline'
      END AS 'DVR Status',


      DATE_FORMAT(d.cdate, '%d-%m-%Y %H:%i:%s') AS 'Current Date',
      CASE
          WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '00-00-0000 00:00:00'
          ELSE DATE_FORMAT(d.dvr_time, '%d-%m-%Y %H:%i:%s')
      END AS 'DVR Time',

        CASE 
        WHEN d.dvr_time IS NOT NULL THEN 
            CASE 
                WHEN d.cdate >= d.dvr_time THEN
                    CONCAT(
                        FLOOR(TIMESTAMPDIFF(SECOND, d.dvr_time, d.cdate) / 3600), ':',
                        LPAD(FLOOR(TIMESTAMPDIFF(SECOND, d.dvr_time, d.cdate) % 3600 / 60), 2, '0'), ':',
                        LPAD(TIMESTAMPDIFF(SECOND, d.dvr_time, d.cdate) % 60, 2, '0')
                    )
                ELSE
                    CONCAT(
                        '-', FLOOR(TIMESTAMPDIFF(SECOND, d.cdate, d.dvr_time) / 3600), ':',
                        LPAD(FLOOR(TIMESTAMPDIFF(SECOND, d.cdate, d.dvr_time) % 3600 / 60), 2, '0'), ':',
                        LPAD(TIMESTAMPDIFF(SECOND, d.cdate, d.dvr_time) % 60, 2, '0')
                    )
            END
        ELSE '00:00:00'
    END AS 'Time Difference' ,
      
      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam1 = '') THEN 'Not Available'
      WHEN (d.cam1 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam1 
      END AS cam1,

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam2 = '') THEN 'Not Available'
      WHEN (d.cam2 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam2
      END AS cam2
      ,

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam3 = '') THEN 'Not Available'
      WHEN (d.cam3 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam3
      END AS cam3 ,

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam4 = '') THEN 'Not Available'
      WHEN (d.cam4 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam4
      END AS cam4
      ,
        
     
  CASE
  WHEN d.hdd IN ('Yes', 'Normal', 'ok') THEN 'Working'
  WHEN d.hdd IS NULL THEN 'No Record Found'
  ELSE 'Not Working'
END AS 'HDD Status'
    ,
    CASE
    WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
    WHEN COALESCE(d.recording_from, '') = '' THEN '-'
    WHEN d.recording_from LIKE '%T%Z' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%Y-%m-%dT%H:%i:%sZ'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_from REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$' THEN
        DATE_FORMAT(
          STR_TO_DATE(
              d.recording_from,
              '%Y-%m-%d %H:%i:%s'
          ),
          '%d-%m-%Y %H:%i:%s'
      )
    WHEN d.recording_from REGEXP '^[0-9]{4}- [0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%Y- %m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_from REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%Y-%m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_from REGEXP '^[0-9]{1,2} - [0-9]{1,2} - [0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%d - %m - %Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_from REGEXP '^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%d-%m-%Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    ELSE '-'
END AS 'Recording From',

CASE
    WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
    WHEN COALESCE(d.recording_to, '') = '' THEN '-'
    WHEN d.recording_to LIKE '%T%Z' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%Y-%m-%dT%H:%i:%sZ'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_to REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$' THEN
        DATE_FORMAT(
          STR_TO_DATE(
              d.recording_to,
              '%Y-%m-%d %H:%i:%s'
          ),
          '%d-%m-%Y %H:%i:%s'
      )

    WHEN d.recording_to REGEXP '^[0-9]{1,2} - [0-9]{1,2} - [0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%d - %m - %Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_to REGEXP '^[0-9]{4}- [0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%Y- %m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_to REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%Y-%m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_to REGEXP '^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%d-%m-%Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    ELSE '-'
END AS 'Recording To',

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
        WHEN (
          STR_TO_DATE(d.recording_to, '%d - %m - %Y') = CURDATE() 
          OR DATE_FORMAT(d.recording_to, '%Y-%m-%d') = CURDATE()
          OR STR_TO_DATE(d.recording_to, '%Y- %m- %d') = CURDATE()
        ) 
         THEN 'Running'
        ELSE 'Stop'
      END AS 'Recording To Status',

      (CASE 
        WHEN (d.last_communication < d.cdate) THEN 
            CONCAT(FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24), ' days')
        ELSE 
            '-'
    END) AS Aging,

    sed.eng_name,
    sed.eng_contact,
    sed.email_id
    
    
      


      
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP AND s.live='Y'
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  AND o.Status='Y'
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   AND ds.live='Y'
    LEFT JOIN
      site_eng_details sed ON d.IPAddress = sed.IPAddress  
      WHERE
        d.live = 'Y' 
        GROUP BY d.IPAddress
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
    //   query += ` AND (CASE
    //    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID LIKE '%${atmid}%'
    //    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID LIKE '%${atmid}%'
    //    ELSE o.ATMID LIKE '%${atmid}%'
    //    END)`;
  }

  // query += ` GROUP BY d.IPAddress`;

  const countQuery = `
      SELECT COUNT(DISTINCT IPAddress) as count
      FROM
      all_dvr_live d
      WHERE
        d.live = 'Y'
       ${atmid ? ` AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/newallsitesexport_api', (req, res) => {
  const { atmid } = req.query;

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        WHEN (d.atmid IS NOT NULL) THEN d.atmid

        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS 'Project',
 

      d.IPAddress as 'IP Address',
      d.dvrname as 'DVR Name',
      


      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS 'Network Status',
      CASE
      WHEN DATE(d.cdate) = CURDATE() AND d.login_status = 0 THEN
          CASE
              WHEN d.latency = '' THEN '-'
              WHEN d.latency IS NULL THEN '-'
              ELSE d.latency
          END
      ELSE '-'
  END AS 'Latency',
      
      CASE
      WHEN DATE(d.cdate) = CURDATE() AND d.login_status = 0 THEN
            CASE
                WHEN d.status = 1 THEN 'Online'
                ELSE 'Offline'
            END
          ELSE 'Offline'
      END AS 'DVR Status',


      DATE_FORMAT(d.cdate, '%d-%m-%Y %H:%i:%s') AS 'Current Date',
      CASE
          WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '00-00-0000 00:00:00'
          ELSE DATE_FORMAT(d.dvr_time, '%d-%m-%Y %H:%i:%s')
      END AS 'DVR Time',

        CASE 
        WHEN d.dvr_time IS NOT NULL THEN 
            CASE 
                WHEN d.cdate >= d.dvr_time THEN
                    CONCAT(
                        FLOOR(TIMESTAMPDIFF(SECOND, d.dvr_time, d.cdate) / 3600), ':',
                        LPAD(FLOOR(TIMESTAMPDIFF(SECOND, d.dvr_time, d.cdate) % 3600 / 60), 2, '0'), ':',
                        LPAD(TIMESTAMPDIFF(SECOND, d.dvr_time, d.cdate) % 60, 2, '0')
                    )
                ELSE
                    CONCAT(
                        '-', FLOOR(TIMESTAMPDIFF(SECOND, d.cdate, d.dvr_time) / 3600), ':',
                        LPAD(FLOOR(TIMESTAMPDIFF(SECOND, d.cdate, d.dvr_time) % 3600 / 60), 2, '0'), ':',
                        LPAD(TIMESTAMPDIFF(SECOND, d.cdate, d.dvr_time) % 60, 2, '0')
                    )
            END
        ELSE '00:00:00'
    END AS 'Time Difference' ,
      
      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam1 = '') THEN 'Not Available'
      WHEN (d.cam1 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam1 
      END AS cam1,

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam2 = '') THEN 'Not Available'
      WHEN (d.cam2 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam2
      END AS cam2
      ,

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam3 = '') THEN 'Not Available'
      WHEN (d.cam3 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam3
      END AS cam3 ,

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
      WHEN (d.cam4 = '') THEN 'Not Available'
      WHEN (d.cam4 IS NULL) THEN 'Not Available'
      WHEN (d.login_status = 1) THEN 'Not Available'
      ELSE  d.cam4
      END AS cam4
      ,
        
     
  CASE
  WHEN d.hdd IN ('Yes', 'Normal', 'ok') THEN 'Working'
  WHEN d.hdd IS NULL THEN 'No Record Found'
  ELSE 'Not Working'
END AS 'HDD Status'
    ,
    CASE
    WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
    WHEN COALESCE(d.recording_from, '') = '' THEN '-'
    WHEN d.recording_from LIKE '%T%Z' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%Y-%m-%dT%H:%i:%sZ'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_from REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$' THEN
        DATE_FORMAT(
          STR_TO_DATE(
              d.recording_from,
              '%Y-%m-%d %H:%i:%s'
          ),
          '%d-%m-%Y %H:%i:%s'
      )
    WHEN d.recording_from REGEXP '^[0-9]{4}- [0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%Y- %m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_from REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%Y-%m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_from REGEXP '^[0-9]{1,2} - [0-9]{1,2} - [0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%d - %m - %Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_from REGEXP '^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_from,
                '%d-%m-%Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    ELSE '-'
END AS 'Recording From',

CASE
    WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
    WHEN COALESCE(d.recording_to, '') = '' THEN '-'
    WHEN d.recording_to LIKE '%T%Z' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%Y-%m-%dT%H:%i:%sZ'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_to REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}$' THEN
        DATE_FORMAT(
          STR_TO_DATE(
              d.recording_to,
              '%Y-%m-%d %H:%i:%s'
          ),
          '%d-%m-%Y %H:%i:%s'
      )

    WHEN d.recording_to REGEXP '^[0-9]{1,2} - [0-9]{1,2} - [0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%d - %m - %Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_to REGEXP '^[0-9]{4}- [0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%Y- %m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
        WHEN d.recording_to REGEXP '^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%Y-%m-%d'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    WHEN d.recording_to REGEXP '^[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}$' THEN
        DATE_FORMAT(
            STR_TO_DATE(
                d.recording_to,
                '%d-%m-%Y'
            ),
            '%d-%m-%Y %H:%i:%s'
        )
    ELSE '-'
END AS 'Recording To',

      CASE
      WHEN d.dvr_time = '' OR d.dvr_time IS NULL THEN '-'
        WHEN (
          STR_TO_DATE(d.recording_to, '%d - %m - %Y') = CURDATE() 
          OR DATE_FORMAT(d.recording_to, '%Y-%m-%d') = CURDATE()
          OR STR_TO_DATE(d.recording_to, '%Y- %m- %d') = CURDATE()
        ) 
         THEN 'Running'
        ELSE 'Stop'
      END AS 'Recording To Status',

      (CASE 
        WHEN (d.last_communication < d.cdate) THEN 
            CONCAT(FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24), ' days')
        ELSE 
            '-'
    END) AS Aging,
    IF(DATEDIFF(CURDATE(), d.last_communication) = 0, '-', CONCAT(DATEDIFF(CURDATE(), d.last_communication), ' days')) AS network_aging,
    sed.eng_name,
    sed.eng_contact,
    sed.email_id,
    d.remarks
    
    
      


      
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP AND s.live='Y'
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  AND o.Status='Y'
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   AND ds.live='Y'
    LEFT JOIN
      site_eng_details sed ON d.IPAddress = sed.IPAddress   
    WHERE
        d.live = 'Y' 
        GROUP BY d.IPAddress
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
    //   query += ` AND (CASE
    //    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID LIKE '%${atmid}%'
    //    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID LIKE '%${atmid}%'
    //    ELSE o.ATMID LIKE '%${atmid}%'
    //    END)`;
  }

  // query += ` GROUP BY d.IPAddress`;

  const countQuery = `
      SELECT COUNT(DISTINCT IPAddress) as count
      FROM
      all_dvr_live d
      WHERE
        d.live = 'Y'
       ${atmid ? ` AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});


app.get('/onlinesites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT
  (CASE
    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
    ELSE o.ATMID
  END) AS ATMID,
  d.IPAddress,
  d.dvrname,
  d.cam1,
  d.cam2,
  d.cam3,
  d.cam4,
  (CASE 
     WHEN d.dvr_time IS NOT NULL THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
     ELSE ''
  END) AS time_diff,
  (CASE 
     WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate), 60))
     ELSE ''
  END) AS never_up,
  (CASE 
    WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
    FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
    ELSE ''
 END) AS down_since,
  d.project,
  DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  d.latency,
  (CASE
      WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
      ELSE 'not available'
  END) AS recording_to_status,
  d.recording_to,
  d.recording_from,
  d.dvrname,
  (CASE
      WHEN (d.hdd = 'Yes' OR d.hdd = 'ok') THEN 'working'
      ELSE 'not working'
  END) AS hdd_status,
  (CASE
      WHEN d.login_status = 0 THEN 'working'
      ELSE 'not working'
  END) AS login_status,
  (CASE
      WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
      ELSE 'Offline'
  END) AS dvr_status,
  (CASE
      WHEN d.status = 1 THEN 'Online'
      ELSE 'Offline'
  END) AS ping_status,
  DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time, 
DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
(CASE
WHEN (s.Bank IS NOT NULL) THEN s.Bank
WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
ELSE o.Bank
END) AS Bank,
(CASE
WHEN (s.Customer IS NOT NULL) THEN s.Customer
WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
ELSE o.Customer
END) AS Customer,
(CASE
WHEN (s.City IS NOT NULL) THEN s.City
WHEN (ds.City IS NOT NULL) THEN ds.City
ELSE o.city
END) AS City,
(CASE
  WHEN (s.State IS NOT NULL) THEN s.State
  WHEN (ds.State IS NOT NULL) THEN ds.State
  ELSE o.State
END) AS State,
(CASE
WHEN (s.Zone IS NOT NULL) THEN s.Zone
WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
ELSE o.zone
END) AS Zone,    
(CASE
WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
ELSE o.Address
END) AS SiteAddress,
(CASE
WHEN (s.project IS NOT NULL) THEN s.project
WHEN (ds.project IS NOT NULL) THEN ds.project
ELSE o.project
END) AS project,
'working' AS http_port,
'working' AS rtsp_port,  
'working' AS sdk_port,  
'working' AS ai_port
FROM
all_dvr_live d
LEFT JOIN
sites s ON d.IPAddress = s.DVRIP
LEFT JOIN
dvronline o ON d.IPAddress = o.IPAddress  
LEFT JOIN
dvrsite ds ON d.IPAddress = ds.DVRIP  
 
WHERE
  d.live = 'Y'
  AND d.login_status = 0 AND d.status = 1
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
       SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
       d.live = 'Y'
      AND d.login_status = 0 AND d.status = 1
        ${atmid ? ` AND d.ATMID LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/offlinesites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT
  (CASE
    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
    ELSE o.ATMID
  END) AS ATMID,
  d.IPAddress,
  d.dvrname,
  d.cam1,
  d.cam2,
  d.cam3,
  d.cam4,
  (CASE 
     WHEN d.dvr_time IS NOT NULL THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
     ELSE ''
  END) AS time_diff,
  (CASE 
     WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate), 60))
     ELSE ''
  END) AS never_up,
  (CASE 
    WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
    FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
    ELSE ''
 END) AS down_since,
  d.project,
  DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  d.latency,
  (CASE
      WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
      ELSE 'not available'
  END) AS recording_to_status,
  d.recording_to,
  d.recording_from,
  d.dvrname,
  (CASE
      WHEN (d.hdd = 'Yes' OR d.hdd = 'ok') THEN 'working'
      ELSE 'not working'
  END) AS hdd_status,
  (CASE
      WHEN d.login_status = 0 THEN 'working'
      ELSE 'not working'
  END) AS login_status,
  (CASE
      WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
      ELSE 'Offline'
  END) AS dvr_status,
  (CASE
      WHEN d.status = 1 THEN 'Online'
      ELSE 'Offline'
  END) AS ping_status,
  DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time, 
DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
(CASE
WHEN (s.Bank IS NOT NULL) THEN s.Bank
WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
ELSE o.Bank
END) AS Bank,
(CASE
WHEN (s.Customer IS NOT NULL) THEN s.Customer
WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
ELSE o.Customer
END) AS Customer,
(CASE
WHEN (s.City IS NOT NULL) THEN s.City
WHEN (ds.City IS NOT NULL) THEN ds.City
ELSE o.city
END) AS City,
(CASE
  WHEN (s.State IS NOT NULL) THEN s.State
  WHEN (ds.State IS NOT NULL) THEN ds.State
  ELSE o.State
END) AS State,
(CASE
WHEN (s.Zone IS NOT NULL) THEN s.Zone
WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
ELSE o.zone
END) AS Zone,    
(CASE
WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
ELSE o.Address
END) AS SiteAddress,
(CASE
WHEN (s.project IS NOT NULL) THEN s.project
WHEN (ds.project IS NOT NULL) THEN ds.project
ELSE o.project
END) AS project,
'working' AS http_port,
'working' AS rtsp_port,  
'working' AS sdk_port,  
'working' AS ai_port
FROM
all_dvr_live d
LEFT JOIN
sites s ON d.IPAddress = s.DVRIP
LEFT JOIN
dvronline o ON d.IPAddress = o.IPAddress  
LEFT JOIN
dvrsite ds ON d.IPAddress = ds.DVRIP  
 
WHERE
  d.live = 'Y'
  AND d.login_status = 1 AND d.status = 1
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
       SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
       d.live = 'Y'
      AND d.login_status = 1 AND d.status = 1
        ${atmid ? ` AND d.ATMID LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/dvrofflinesites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT
  (CASE
    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
    ELSE o.ATMID
  END) AS ATMID,
  d.IPAddress,
  d.dvrname,
  d.cam1,
  d.cam2,
  d.cam3,
  d.cam4,
  (CASE 
     WHEN d.dvr_time IS NOT NULL THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
     ELSE ''
  END) AS time_diff,
  (CASE 
     WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate), 60))
     ELSE ''
  END) AS never_up,
  (CASE 
    WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
    FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
    ELSE ''
 END) AS down_since,
  d.project,
  DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  d.latency,
  (CASE
      WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
      ELSE 'not available'
  END) AS recording_to_status,
  d.recording_to,
  d.recording_from,
  d.dvrname,
  (CASE
      WHEN (d.hdd = 'Yes' OR d.hdd = 'ok') THEN 'working'
      ELSE 'not working'
  END) AS hdd_status,
  (CASE
      WHEN d.login_status = 0 THEN 'working'
      ELSE 'not working'
  END) AS login_status,
  (CASE
      WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
      ELSE 'Offline'
  END) AS dvr_status,
  (CASE
      WHEN d.status = 1 THEN 'Online'
      ELSE 'Offline'
  END) AS ping_status,
  DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time, 
DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
(CASE
WHEN (s.Bank IS NOT NULL) THEN s.Bank
WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
ELSE o.Bank
END) AS Bank,
(CASE
WHEN (s.Customer IS NOT NULL) THEN s.Customer
WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
ELSE o.Customer
END) AS Customer,
(CASE
WHEN (s.City IS NOT NULL) THEN s.City
WHEN (ds.City IS NOT NULL) THEN ds.City
ELSE o.city
END) AS City,
(CASE
  WHEN (s.State IS NOT NULL) THEN s.State
  WHEN (ds.State IS NOT NULL) THEN ds.State
  ELSE o.State
END) AS State,
(CASE
WHEN (s.Zone IS NOT NULL) THEN s.Zone
WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
ELSE o.zone
END) AS Zone,    
(CASE
WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
ELSE o.Address
END) AS SiteAddress,
(CASE
WHEN (s.project IS NOT NULL) THEN s.project
WHEN (ds.project IS NOT NULL) THEN ds.project
ELSE o.project
END) AS project,
'working' AS http_port,
'working' AS rtsp_port,  
'working' AS sdk_port,  
'working' AS ai_port
FROM
all_dvr_live d
LEFT JOIN
sites s ON d.IPAddress = s.DVRIP
LEFT JOIN
dvronline o ON d.IPAddress = o.IPAddress  
LEFT JOIN
dvrsite ds ON d.IPAddress = ds.DVRIP  
 
WHERE
  d.live = 'Y'
  AND d.login_status = 1
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
       SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
       d.live = 'Y'
      AND d.login_status = 1 AND d.status = 1
        ${atmid ? ` AND d.ATMID LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});


app.get('/netonlinesites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
    SELECT
      CASE
      WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
      WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
      ELSE o.ATMID
    END AS atmid,
    CASE
      WHEN (s.Bank IS NOT NULL) THEN s.Bank
      WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
      ELSE o.Bank
    END AS Bank,
    CASE
      WHEN (s.Customer IS NOT NULL) THEN s.Customer
      WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
      ELSE o.Customer
    END AS Customer,
    CASE
      WHEN (s.City IS NOT NULL) THEN s.City
      WHEN (ds.City IS NOT NULL) THEN ds.City
      ELSE o.city
    END AS City,
    CASE
        WHEN (s.State IS NOT NULL) THEN s.State
        WHEN (ds.State IS NOT NULL) THEN ds.State
        ELSE o.State
        END AS State,
    CASE
      WHEN (s.Zone IS NOT NULL) THEN s.Zone
      WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
      ELSE o.zone
    END AS Zone,    
    CASE
      WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
      WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
      ELSE o.Address
    END AS SiteAddress,
        d.IPAddress,
        d.cam1,
        d.cam2,
        d.cam3,
        d.cam4,
        DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
        d.latency,
        DATE_FORMAT(d.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,
        DATE_FORMAT(d.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
        d.ipcamtype,
        CASE
        WHEN d.hdd = 'ok' THEN 'working'
        ELSE 'not working'
    END AS hdd_status,
    CASE
        WHEN d.login_status = 0 THEN 'working'
        ELSE 'not working'
    END AS login_status,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication
        
      FROM
        all_dvr_live d
        LEFT JOIN
        sites s ON d.IPAddress = s.DVRIP
      LEFT JOIN
        dvronline o ON d.IPAddress = o.IPAddress  
      LEFT JOIN
        dvrsite ds ON d.IPAddress = ds.DVRIP 
        WHERE
        d.status = 1
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
       WHERE
        d.status = 1
        AND d.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/netofflinesites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT
  CASE
  WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
  WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
  ELSE o.ATMID
END AS atmid,
CASE
  WHEN (s.Bank IS NOT NULL) THEN s.Bank
  WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
  ELSE o.Bank
END AS Bank,
CASE
  WHEN (s.Customer IS NOT NULL) THEN s.Customer
  WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
  ELSE o.Customer
END AS Customer,
CASE
  WHEN (s.City IS NOT NULL) THEN s.City
  WHEN (ds.City IS NOT NULL) THEN ds.City
  ELSE o.city
END AS City,
CASE
    WHEN (s.State IS NOT NULL) THEN s.State
    WHEN (ds.State IS NOT NULL) THEN ds.State
    ELSE o.State
    END AS State,
CASE
  WHEN (s.Zone IS NOT NULL) THEN s.Zone
  WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
  ELSE o.zone
END AS Zone,    
CASE
  WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
  WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
  ELSE o.Address
END AS SiteAddress,
    d.IPAddress,
    d.cam1,
    d.cam2,
    d.cam3,
    d.cam4,
    DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
    d.latency,
    DATE_FORMAT(d.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,
    DATE_FORMAT(d.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
    d.ipcamtype,
    CASE
    WHEN d.hdd = 'ok' THEN 'working'
    ELSE 'not working'
END AS hdd_status,
CASE
    WHEN d.login_status = 0 THEN 'working'
    ELSE 'not working'
END AS login_status,
DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication
    
  FROM
    all_dvr_live d
    LEFT JOIN
    sites s ON d.IPAddress = s.DVRIP
  LEFT JOIN
    dvronline o ON d.IPAddress = o.IPAddress  
  LEFT JOIN
    dvrsite ds ON d.IPAddress = ds.DVRIP 
    WHERE
    d.status = 0
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
       WHERE
        d.status = 0
        AND d.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});



app.get('/rec_not_available_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT
        d.atmid,
        d.ip,
        d.cam1,
        d.cam2,
        d.cam3,
        d.cam4,
        DATE_FORMAT(d.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,
        DATE_FORMAT(d.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
        CASE
        WHEN d.hdd = 'ok' THEN 'working'
        ELSE 'not working'
    END AS hdd_status,
    CASE
        WHEN d.login_status = 0 THEN 'working'
        ELSE 'not working'
    END AS login_status,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        s.Bank,
        s.City,
        s.State,
        s.SiteAddress,
        s.Zone
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE
    s.live = 'Y'
    AND DATE(d.recording_to) != CURDATE()
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE
    s.live = 'Y'
    AND DATE(d.recording_to) != CURDATE()
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

const formatDate = (inputDate) => {
  const dateObj = new Date(inputDate);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

app.get('/devicehistoryThree/:atmId', (req, res) => {
  // console.log("Incoming Request:", req.params, req.query);
  const { atmId } = req.params;
  const { limit, offset, startDate, endDate } = req.query;
  console.log("start", startDate);
  console.log("end", endDate);
  let query = `
      SELECT
  (CASE
    WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
    WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
    ELSE o.ATMID
  END) AS ATMID,
  d.IPAddress,
  d.dvrname,
  d.cam1,
  d.cam2,
  d.cam3,
  d.cam4,
  (CASE 
     WHEN d.dvr_time IS NOT NULL THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
     ELSE ''
  END) AS time_diff,
  (CASE 
     WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
     CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.last_communication, d.cdate), 60))
     ELSE ''
  END) AS never_up,
  (CASE 
    WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
    FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
    ELSE ''
 END) AS down_since,
  d.project,
  
  DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,


  d.latency,
  (CASE
      WHEN DATE(d.recording_to) = CURDATE() THEN 'available'
      ELSE 'not available'
  END) AS recording_to_status,
  dh.recording_to,
  dh.recording_from,
  d.dvrname,
  (CASE
      WHEN (d.hdd = 'Yes' OR d.hdd = 'ok') THEN 'working'
      ELSE 'not working'
  END) AS hdd_status,
  (CASE
      WHEN d.login_status = 0 THEN 'working'
      ELSE 'not working'
  END) AS login_status,
  (CASE
      WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
      ELSE 'Offline'
  END) AS dvr_status,
  (CASE
      WHEN d.status = 1 THEN 'Online'
      ELSE 'Offline'
  END) AS ping_status,
  DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time, 

DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
(CASE
WHEN (s.Bank IS NOT NULL) THEN s.Bank
WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
ELSE o.Bank
END) AS Bank,
(CASE
WHEN (s.Customer IS NOT NULL) THEN s.Customer
WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
ELSE o.Customer
END) AS Customer,
(CASE
WHEN (s.City IS NOT NULL) THEN s.City
WHEN (ds.City IS NOT NULL) THEN ds.City
ELSE o.city
END) AS City,
(CASE
  WHEN (s.State IS NOT NULL) THEN s.State
  WHEN (ds.State IS NOT NULL) THEN ds.State
  ELSE o.State
END) AS State,
(CASE
WHEN (s.Zone IS NOT NULL) THEN s.Zone
WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
ELSE o.zone
END) AS Zone,    
(CASE
WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
ELSE o.Address
END) AS SiteAddress,
(CASE
WHEN (s.project IS NOT NULL) THEN s.project
WHEN (ds.project IS NOT NULL) THEN ds.project
ELSE o.project
END) AS project,
'working' AS http_port,
'working' AS rtsp_port,  
'working' AS sdk_port,  
'working' AS ai_port
FROM
dvr_history dh
LEFT JOIN
all_dvr_live d ON d.IPAddress = dh.ip
LEFT JOIN
sites s ON d.IPAddress = s.DVRIP
LEFT JOIN
dvronline o ON d.IPAddress = o.IPAddress  
LEFT JOIN
dvrsite ds ON d.IPAddress = ds.DVRIP
      
      WHERE
        d.IPAddress = ? 
        `;
  // and d.cdate >= NOW() - INTERVAL 1 MONTH

  if (atmId) {
    query += ` AND d.IPAddress LIKE '%${atmId}%'`;
    // query += ` AND (CASE
    //  WHEN (s.ATMID IS NOT NULL) THEN s.ATMID LIKE '%${atmId}%'
    //  ELSE o.ATMID LIKE '%${atmId}%'
    //  END)`;
  }

  const queryParams = [atmId];
  if (startDate && endDate) {
    const formattedStartDate = formatDate(startDate) + ' 00:00:00';
    const formattedEndDate = formatDate(endDate) + ' 23:59:59';
    query += ` AND DATE(last_communication) BETWEEN ? AND ?`;
    queryParams.push(formattedStartDate, formattedEndDate);

    // console.log("Formatted Start Date:", formattedStartDate);
    // console.log("Formatted End Date:", formattedEndDate);
  }

  query += ` ORDER BY dh.id DESC LIMIT ? OFFSET ?`;
  queryParams.push(Number(limit), Number(offset));

  //console.log("Generated SQL query:", query);
  // console.log("Query parameters:", queryParams);

  const totalCountQuery = `
      SELECT COUNT(*) AS totalCount
      FROM dvr_history
      WHERE ip = ?
  `;

  pool.query(totalCountQuery, [atmId], (error, countResult) => {
    if (error) {
      console.error('Error fetching total count of records:', error);
      res.status(500).json({ error: 'Error fetching total count of records' });
      return;
    }

    const totalCount = countResult[0].totalCount;

    pool.query(query, queryParams, (error, results) => {
      if (error) {
        // console.error('Error fetching history data:', error);
        res.status(500).json({ error: 'Error fetching history data' + query });
        return;
      }

      res.json({ data: results, totalCount });
    });
  });
});


app.get('/neveronsites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS atmid,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS CITY,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS STATE,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS ZONE,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      d.IPAddress
  
  FROM
  all_dvr_live d
  LEFT JOIN
    sites s ON d.IPAddress = s.DVRIP
  LEFT JOIN
    dvronline o ON d.IPAddress = o.IPAddress  
  LEFT JOIN
    dvrsite ds ON d.IPAddress = ds.DVRIP 
  WHERE
    d.login_status IS NULL
    and d.live ='Y' 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
      d.login_status IS NULL
       ${atmid ? ` AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/ExportNeverOnSites', (req, res) => {

  let query = `
  SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS atmid,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS CITY,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS STATE,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS ZONE,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      d.IPAddress
  
  FROM
  all_dvr_live d
  LEFT JOIN
    sites s ON d.IPAddress = s.DVRIP
  LEFT JOIN
    dvronline o ON d.IPAddress = o.IPAddress  
  LEFT JOIN
    dvrsite ds ON d.IPAddress = ds.DVRIP 
  WHERE
    d.login_status IS NULL
    `;


  pool.query(query, (error, results) => {
    if (error) throw error;

    res.json({
      data: results
    });

  });
});



app.get('/hddnotqorking_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = 'Error' OR d.hdd = 'Not Exist' OR d.hdd = 'notexist' OR d.hdd = 'abnormal' OR d.hdd = 'unformatted' OR d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk' OR d.hdd = '1')
    AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = 'Error' OR d.hdd = 'Not Exist' OR d.hdd = 'notexist' OR d.hdd = 'abnormal' OR d.hdd = 'unformatted' OR d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk' OR d.hdd = '1')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});


app.get('/hddnodisk_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk')
    AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});


app.get('/hdderror_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = 'Error')
    AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = 'Error')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});


app.get('/hddabnormal_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = 'Abnormal')
    AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = 'Abnormal')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/hddunformatted_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = 'Unformatted')
    AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = 'Unformatted')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/hddone_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = '1')
    AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = '1')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});


app.get('/hddnotexist_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.IPAddress, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
    d.cdate,
    DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
    s.city, 
    s.state, 
    s.zone, 
    s.SiteAddress,
    s.Bank,
    d.hdd, 
    CASE 
        WHEN d.login_status = '0' THEN 'working' 
        ELSE 'not working' 
    END AS login_status, 
    DATEDIFF(NOW(), d.cdate) AS days_difference 
FROM 
    all_dvr_live d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
(d.hdd = 'Not Exist' OR d.hdd = 'notexist')
        AND s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
        all_dvr_live d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE 
        (d.hdd = 'Not Exist' OR d.hdd = 'notexist')
        AND s.live = 'Y'
        ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/current_cdate', (req, res) => {
  const query = `
        SELECT DATE_FORMAT(cdate, '%Y-%m-%d %H:%i:%s') AS cdate FROM all_dvr_live WHERE cdate IS NOT NULL ORDER BY cdate DESC LIMIT 1;
    `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});


app.get('/hddnotworking_count', (req, res) => {
  const query = `
        SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE (hdd = 'Error' OR hdd = 'Not Exist' OR hdd = 'notexist' OR hdd = 'abnormal' OR hdd = 'unformatted' OR hdd = 'No' OR hdd = 'No disk/idle' OR hdd = 'No Disk' OR hdd = '1');
    `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});


app.get('/hddnotworking_count_new', (req, res) => {
  const query = `
        SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
    `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.get('/summaryData', (req, res) => {
  const query = `
  SELECT hdd, COUNT(*) AS count_per_value FROM dvr_health GROUP BY hdd;
  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});

app.get('/unformattedSites', (req, res) => {
  const query = `
  SELECT 
  dh.ip, 
  dh.cam1, dh.cam2, dh.cam3, dh.cam4, 
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
  dh.atmid, 
  dh.recording_from, dh.recording_to,
  s.City, s.State, s.Zone,
  CASE WHEN dh.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status, 
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference -- Calculate days difference
FROM 
  dvr_health dh
JOIN 
  sites s ON dh.atmid = s.ATMID
WHERE 
  dh.hdd = 'unformatted'
  AND s.live = 'Y';

  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});


app.get('/abnormalSites', (req, res) => {
  const query = `
  SELECT 
  dh.ip, 
  dh.cam1, dh.cam2, dh.cam3, dh.cam4, 
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
  dh.atmid, 
  dh.recording_from, dh.recording_to,
  s.City, s.State, s.Zone,
  CASE WHEN dh.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status, -- Calculate login status
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference -- Calculate days difference
FROM 
  dvr_health dh
JOIN 
  sites s ON dh.atmid = s.ATMID
WHERE 
  dh.hdd = 'abnormal' -- Filter for 'abnormal' condition
  AND s.live = 'Y';
;
  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});


app.get('/NullSites', (req, res) => {
  const query = `
  SELECT
  dh.ip,
  dh.cam1,
  dh.cam2,
  dh.cam3,
  dh.cam4,
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
  dh.atmid,
  dh.recording_from,
  dh.recording_to,
  s.City,
  s.State,
  s.Zone,
  CASE
      WHEN dh.login_status = 0 THEN 'working'
      ELSE 'not working'
  END AS login_status,
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference
FROM
  dvr_health dh
JOIN
  sites s ON dh.atmid = s.ATMID
WHERE
  dh.hdd IS NULL
  AND s.live = 'Y';

  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});


app.get('/noDiscIdleSites', (req, res) => {
  const query = `
  SELECT 
  dh.ip, 
  dh.cam1, dh.cam2, dh.cam3, dh.cam4, 
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
  dh.atmid, 
  dh.recording_from, dh.recording_to,
  s.City, s.State, s.Zone,
  CASE WHEN dh.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status, -- Calculate login status
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference -- Calculate days difference
FROM 
  dvr_health dh
JOIN 
  sites s ON dh.atmid = s.ATMID
WHERE 
  dh.hdd = 'No disk/idle'
  AND s.live = 'Y';

  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});


app.get('/errorSites', (req, res) => {
  const query = `
  SELECT 
  dh.ip, dh.cam1, dh.cam2, dh.cam3, dh.cam4, 
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
  dh.atmid, dh.recording_from, dh.recording_to,
  s.City, s.State, s.Zone,
  CASE WHEN dh.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status, -- Calculate login status
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference -- Calculate days difference
FROM 
  dvr_health dh
JOIN 
  sites s ON dh.atmid = s.ATMID
WHERE 
  dh.hdd IN ('Error', '1', '2')
  AND s.live = 'Y';
  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});


app.get('/NoDiskSites', (req, res) => {
  const query = `
  SELECT 
  dh.ip, dh.cam1, dh.cam2, dh.cam3, dh.cam4, 
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
  dh.atmid, dh.recording_from, dh.recording_to,
  s.City, s.State, s.Zone,
  CASE WHEN dh.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status, -- Calculate login status
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference -- Calculate days difference
FROM 
  dvr_health dh
JOIN 
  sites s ON dh.atmid = s.ATMID
WHERE 
  dh.hdd = 'No Disk'
  AND s.live = 'Y';
  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});

app.get('/notexistSites', (req, res) => {
  const query = `
  SELECT 
  dh.ip, 
  dh.cam1, dh.cam2, dh.cam3, dh.cam4, 
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, 
  dh.atmid, 
  dh.recording_from, dh.recording_to,
  s.City, s.State, s.Zone,
  DATEDIFF(CURDATE(), dh.cdate) AS days_difference, -- Calculate days difference
  CASE WHEN dh.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status -- Calculate login status
FROM 
  dvr_health dh
JOIN 
  sites s ON dh.atmid = s.ATMID
WHERE 
  (dh.hdd = 'Not exist' OR dh.hdd = 'notexist')
  AND s.live = 'Y';

  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
    }
  });
});

app.get('/todayshddstatuschange', (req, res) => {
  const query = `
  SELECT DISTINCT dh.atmid, dh2.hdd AS previous_status, dh.hdd AS current_status
FROM dvr_health dh
JOIN dvr_history dh2 ON dh.atmid = dh2.atmid
WHERE DATE(dh2.last_communication) = CURDATE()
AND UPPER(dh2.hdd) = 'OK' 
AND dh.hdd <> 'OK'       
  `;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data:', err);
      res.status(500).json({ error: 'Error fetching DVR history data' });
    } else {
      res.status(200).json(result);
      // console.log(result)
    }
  });
});


app.get('/CameraNotWorking', (req, res) => {
  const query = `
  SELECT 
    (COUNT(CASE WHEN cam1 = 'not working' THEN 1 END) +
    COUNT(CASE WHEN cam2 = 'not working' THEN 1 END) +
    COUNT(CASE WHEN cam3 = 'not working' THEN 1 END) +
    COUNT(CASE WHEN cam4 = 'not working' THEN 1 END)) AS total_count 
  FROM dvr_health;
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting "not working" entries:', err);
      res.status(500).json({ error: 'Error counting "not working" entries' });
    } else {
      const totalCount = result[0].total_count;
      res.status(200).json({ totalCount });
    }
  });
});



app.get('/TotalSites', (req, res) => {
  // SELECT COUNT(id) AS atmCount FROM all_dvr_live WHERE live="Y" GROUP BY IPAddress
  pool.query('SELECT id FROM all_dvr_live WHERE live="Y" GROUP BY IPAddress', (err, result) => {
    if (err) {
      console.error('Error counting ATM IDs:', err);
      res.status(500).json({ error: 'Error counting ATM IDs' });
    } else {
     // const atmCount = result[0].atmCount;
     const atmCount = result.length;
      res.status(200).json({ atmCount });
    }
  });
});

app.get('/OnlineSites', (req, res) => {
  const query = `
      SELECT COUNT(DISTINCT(IPAddress)) AS online_count
      FROM all_dvr_live
      WHERE status=1 AND login_status = 0 ;
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting online entries:', err);
      res.status(500).json({ error: 'Error counting online entries' });
    } else {
      const { online_count } = result[0];

      res.status(200).json({ online_count });
    }
  });
});


app.get('/OfflineSites', (req, res) => {
  const query = `
      SELECT COUNT(DISTINCT(IPAddress)) AS offline_count
      FROM all_dvr_live
      WHERE login_status = 1 AND status = 1;
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting offline entries:', err);
      res.status(500).json({ error: 'Error counting offline entries' });
    } else {
      const { offline_count } = result[0];

      res.status(200).json({ offline_count });
    }
  });
});

app.get('/DVROfflineSites', (req, res) => {
  const query = `
      SELECT COUNT(DISTINCT(IPAddress)) AS offline_count
      FROM all_dvr_live
      WHERE login_status = 1;
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting offline entries:', err);
      res.status(500).json({ error: 'Error counting offline entries' });
    } else {
      const { offline_count } = result[0];

      res.status(200).json({ offline_count });
    }
  });
});

app.get('/NetOnlineSites', (req, res) => {
  
  const query = `
      SELECT COUNT(DISTINCT(IPAddress)) AS net_online_count
      FROM all_dvr_live
      WHERE status = 1;
  `;
  
/* 
  const query = `
      SELECT id
      FROM all_dvr_live
      WHERE status = 1 GROUP BY IPAddress;
  `;  */

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting online entries:', err);
      res.status(500).json({ error: 'Error counting online entries' });
    } else {
      console.log("net_online : ",result[0]);
      const { net_online_count } = result[0];
      res.status(200).json({ net_online_count });
    }
  });
});


app.get('/NetOfflineSites', (req, res) => {
  const query = `
      SELECT COUNT(DISTINCT(IPAddress)) AS net_offline_count
      FROM all_dvr_live
      WHERE status = 0 OR status IS NULL;
  `;
/*
  const query = `
    SELECT COUNT(*) AS net_offline_count
    FROM all_dvr_live
    WHERE status = 0 OR status IS NULL;
  `;
 */

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting offline entries:', err);
      res.status(500).json({ error: 'Error counting offline entries' });
    } else {
      const { net_offline_count } = result[0];

      res.status(200).json({ net_offline_count });
    }
  });
});

app.get('/hddnotworking', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE (hdd = 'Error' OR hdd = 'Not Exist' OR hdd = 'notexist' OR hdd = 'abnormal' OR hdd = 'unformatted' OR hdd = 'No' OR hdd = 'No disk/idle' OR hdd = 'No Disk' OR hdd = '1');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});


app.get('/hddnoDisk', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS no_disk_hdd_count FROM all_dvr_live WHERE (hdd = 'No' OR hdd = 'No disk/idle' OR hdd = 'No Disk');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});



app.get('/hddnotExist', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS not_exist_hdd_count FROM all_dvr_live WHERE (hdd = 'Not Exist' OR hdd = 'notexist');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});



app.get('/hddError', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS error_hdd_count FROM all_dvr_live WHERE (hdd = 'Error');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});



app.get('/hddOne', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS one_hdd_count FROM all_dvr_live WHERE (hdd = '1');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});



app.get('/hddUnformatted', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS unformatted_hdd_count FROM all_dvr_live WHERE (hdd = 'unformatted');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});



app.get('/hddAbnormal', (req, res) => {
  // const query = `
  //     SELECT COUNT(*) AS non_ok_hdd_count FROM all_dvr_live WHERE NOT (hdd = 'ok' OR hdd = 'OK' OR hdd = 'Yes');
  // `;

  const query = `
      SELECT COUNT(*) AS abnormal_hdd_count FROM all_dvr_live WHERE (hdd = 'abnormal');
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});


app.get('/rtsp_not_working_count', (req, res) => {
  const query = `
  SELECT 
  COUNT(*) AS record_count
FROM 
  port_status_network_report p
JOIN 
  (SELECT SN FROM dvr_health) d ON p.site_id = d.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.rtsp_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE(); -- Filter for today's date

  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});


app.get('/rtsp_not_workingdetails_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.rtsp_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.rtsp_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 

       ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/http_not_working_count', (req, res) => {
  const query = `
  SELECT 
  COUNT(*) AS record_count
FROM 
  port_status_network_report p
JOIN 
  (SELECT SN FROM dvr_health) d ON p.site_id = d.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.http_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE(); 

  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.get('/http_not_workingdetails_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Bank,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.http_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.http_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 

       ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/router_not_working_count', (req, res) => {
  const query = `
  SELECT 
  COUNT(*) AS record_count
FROM 
  port_status_network_report p
JOIN 
  (SELECT SN FROM dvr_health) d ON p.site_id = d.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.router_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE(); -- Filter for today's date

  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.get('/router_not_workingdetails_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.router_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.router_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 

       ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});




app.get('/sdk_not_working_count', (req, res) => {
  const query = `
  SELECT 
  COUNT(*) AS record_count
FROM 
  port_status_network_report p
JOIN 
  (SELECT SN FROM dvr_health) d ON p.site_id = d.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.sdk_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE(); -- Filter for today's date

  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});


app.get('/sdk_not_workingdetails_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.sdk_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.sdk_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 

       ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/ai_not_working_count', (req, res) => {
  const query = `
  SELECT 
  COUNT(*) AS record_count
FROM 
  port_status_network_report p
JOIN 
  (SELECT SN FROM dvr_health) d ON p.site_id = d.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.ai_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE(); -- Filter for today's date

  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.get('/ai_not_workingdetails_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
  SELECT 
  p.site_id,
  DATE_FORMAT(p.rectime, '%Y-%m-%d %H:%i:%s') AS rectime,
  s.SN,
  s.ATMID,
  s.Bank,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.ai_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
  SELECT 
  p.site_id,
  p.rectime AS latest_rectime,
  s.SN,
  s.ATMID,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress
FROM 
  port_status_network_report p
JOIN 
  sites s ON p.site_id = s.SN
JOIN 
  (SELECT site_id, MAX(rectime) AS max_rectime
   FROM port_status_network_report
   GROUP BY site_id) max_times ON p.site_id = max_times.site_id 
                                AND p.rectime = max_times.max_rectime
WHERE 
  p.ai_port IN ('O', 'N')
  AND DATE(p.rectime) = CURDATE()
AND s.live = "Y" 

       ${atmid ? `AND d.atmid LIKE '%${atmid}%'` : ''}
    `;

  query += ` LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      res.json({
        data: results,
        totalCount,
      });
    });
  });
});

app.get('/rec_not_available_count', (req, res) => {
  const query = `
  SELECT
    COUNT(*) AS not_available_count
FROM
    dvr_health d
LEFT JOIN
    sites s ON d.atmid = s.ATMID
WHERE
    s.live = 'Y'
    AND DATE(d.recording_to) != CURDATE(); -- Filter for recording_to date not today
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data:', err);
      res.status(500).json({ error: 'Error fetching DVR health data' });
    } else {
      res.status(200).json(result[0]);
    }
  });
});

app.get('/neveron', (req, res) => {
  // const query = `
  // SELECT COUNT(*) AS neveron FROM dvr_health WHERE cdate IS NULL OR cdate = '';
  // `;

  const query = `
  SELECT COUNT(*) AS neveron FROM all_dvr_live WHERE login_status IS NULL;
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error counting data where last_communication is not today:', err);
      res.status(500).json({ error: 'Error counting data' });
    } else {
      const { neveron } = result[0];

      res.status(200).json({ neveron });
    }
  });
});

app.get('/RecNotavailableExport', (req, res) => {

  const query = `
  SELECT
  dh.atmid,
  dh.login_status,
  DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  dh.cam1,
  dh.cam2,
  dh.cam3,
  dh.cam4,
  dh.dvrtype,
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
  DATE_FORMAT(dh.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
  DATE_FORMAT(dh.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,
  DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  dh.ip AS routerip,
  CASE WHEN dh.hdd = 'ok' THEN 'working' ELSE 'not working' END AS hdd_status,
  CONCAT(
      FLOOR(TIMESTAMPDIFF(MINUTE, dh.cdate, NOW()) / 60),
      ':',
      MOD(TIMESTAMPDIFF(MINUTE, dh.cdate, NOW()), 60)
  ) AS time_difference_hours_minutes
FROM
  dvr_health dh
WHERE
  dh.recording_to <> CURDATE()
  AND dh.live = 'Y'       
  `;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});



app.get('/DeviceHistoryExport/:atmId', (req, res) => {
  const { atmId } = req.params;
  const query = `
  SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      dvr_history dh
      LEFT JOIN
  all_dvr_live d ON dh.ip = d.IPAddress
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' 
        AND d.IPAddress = ? order by dh.id desc`;
  console.log("device history : ", query);
  pool.query(query, [atmId], (err, result) => {
    if (err) {
      console.error('Error fetching DVR history data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR history data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportNetOnlineSites', (req, res) => {
  let query = `
  SELECT
  CASE
  WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
  WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
  ELSE o.ATMID
END AS atmid,
CASE
  WHEN (s.Bank IS NOT NULL) THEN s.Bank
  WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
  ELSE o.Bank
END AS Bank,
CASE
  WHEN (s.City IS NOT NULL) THEN s.City
  WHEN (ds.City IS NOT NULL) THEN ds.City
  ELSE o.city
END AS city,
CASE
    WHEN (s.State IS NOT NULL) THEN s.State
    WHEN (ds.State IS NOT NULL) THEN ds.State
    ELSE o.State
    END AS state,
CASE
  WHEN (s.Zone IS NOT NULL) THEN s.Zone
  WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
  ELSE o.zone
END AS zone,    
CASE
  WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
  WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
  ELSE o.Address
END AS SiteAddress,
  dh.IPAddress AS routerip,
  CASE
      WHEN dh.login_status = 0 THEN 'working'
      ELSE 'not working'
  END AS login_status,
  DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
  CASE WHEN dh.hdd = 'ok' THEN 'working' ELSE 'not working' END AS hdd_status,
  dh.cam1,
  dh.cam2,
  dh.cam3,
  dh.cam4,
  DATE_FORMAT(dh.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
  DATE_FORMAT(dh.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,          
  CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, dh.cdate, NOW()) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, dh.cdate, NOW()), 60)) AS time_difference_hours_minutes
FROM
  all_dvr_live dh
  LEFT JOIN
  sites s ON dh.IPAddress = s.DVRIP
LEFT JOIN
  dvronline o ON dh.IPAddress = o.IPAddress  
LEFT JOIN
  dvrsite ds ON dh.IPAddress = ds.DVRIP
WHERE
  dh.status = 1
  AND dh.live = 'Y' GROUP BY dh.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});

app.get('/ExportNetOfflineSites', async (req, res) => {

  let query = `
  SELECT
  CASE
  WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
  WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
  ELSE o.ATMID
END AS atmid,
CASE
  WHEN (s.Bank IS NOT NULL) THEN s.Bank
  WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
  ELSE o.Bank
END AS Bank,
CASE
  WHEN (s.City IS NOT NULL) THEN s.City
  WHEN (ds.City IS NOT NULL) THEN ds.City
  ELSE o.city
END AS city,
CASE
    WHEN (s.State IS NOT NULL) THEN s.State
    WHEN (ds.State IS NOT NULL) THEN ds.State
    ELSE o.State
    END AS state,
CASE
  WHEN (s.Zone IS NOT NULL) THEN s.Zone
  WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
  ELSE o.zone
END AS zone,    
CASE
  WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
  WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
  ELSE o.Address
END AS SiteAddress,
  dh.IPAddress AS routerip,
  CASE
      WHEN dh.login_status = 0 THEN 'working'
      ELSE 'not working'
  END AS login_status,
  DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
  CASE WHEN dh.hdd = 'ok' THEN 'working' ELSE 'not working' END AS hdd_status,
  dh.cam1,
  dh.cam2,
  dh.cam3,
  dh.cam4,
  DATE_FORMAT(dh.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
  DATE_FORMAT(dh.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,          
  CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, dh.cdate, NOW()) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, dh.cdate, NOW()), 60)) AS time_difference_hours_minutes
FROM
  all_dvr_live dh
  LEFT JOIN
  sites s ON dh.IPAddress = s.DVRIP
LEFT JOIN
  dvronline o ON dh.IPAddress = o.IPAddress  
LEFT JOIN
  dvrsite ds ON dh.IPAddress = ds.DVRIP
WHERE
  dh.status = 0 OR dh.status IS NULL  GROUP BY dh.IPAddress`;


  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportOnlineSites', (req, res) => {
  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND d.status = 1 AND d.login_status = 0 GROUP BY d.IPAddress`;
        //GROUP BY d.IPAddress

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});

app.get('/ExportOfflineSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND d.status = 1 AND d.login_status = 1 GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportDVROfflineSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND d.login_status = 1 GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportHddNoDiskSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND (d.hdd = 'No' OR d.hdd = 'No disk/idle' OR d.hdd = 'No Disk') GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportHddErrorSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND (d.hdd = 'Error') GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportHddAbnormalSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND (d.hdd = 'Abnormal') GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportHddUnformattedSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND (d.hdd = 'Unformatted') GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});


app.get('/ExportHddNotExistSites', async (req, res) => {

  let query = `
      SELECT
      CASE
        WHEN (s.ATMID IS NOT NULL) THEN s.ATMID
        WHEN (ds.ATMID IS NOT NULL) THEN ds.ATMID
        ELSE o.ATMID
      END AS ATMID,
      CASE
        WHEN (s.Bank IS NOT NULL) THEN s.Bank
        WHEN (ds.Bank IS NOT NULL) THEN ds.Bank
        ELSE o.Bank
      END AS Bank,
      CASE
        WHEN (s.Customer IS NOT NULL) THEN s.Customer
        WHEN (ds.Customer IS NOT NULL) THEN ds.Customer
        ELSE o.Customer
      END AS Customer,
      CASE
        WHEN (s.City IS NOT NULL) THEN s.City
        WHEN (ds.City IS NOT NULL) THEN ds.City
        ELSE o.city
      END AS City,
      CASE
          WHEN (s.State IS NOT NULL) THEN s.State
          WHEN (ds.State IS NOT NULL) THEN ds.State
          ELSE o.State
          END AS State,
      CASE
        WHEN (s.Zone IS NOT NULL) THEN s.Zone
        WHEN (ds.Zone IS NOT NULL) THEN ds.Zone
        ELSE o.zone
      END AS Zone,    
      CASE
        WHEN (s.SiteAddress IS NOT NULL) THEN s.SiteAddress
        WHEN (ds.SiteAddress IS NOT NULL) THEN ds.SiteAddress
        ELSE o.Address
      END AS SiteAddress,
      CASE
        WHEN (s.project IS NOT NULL) THEN s.project
        WHEN (ds.project IS NOT NULL) THEN ds.project
        ELSE o.project
      END AS project,
      CASE
          WHEN d.login_status = 0 THEN 'working'
          ELSE 'not working'
      END AS login_status,
      CASE
          WHEN (d.login_status = 0 AND d.status = 1) THEN 'Online'
          ELSE 'Offline'
      END AS dvr_status,
      CASE
            WHEN d.status = 1 THEN 'Online'
            ELSE 'Offline'
      END AS ping_status,
      DATE_FORMAT(d.dvr_time, '%Y-%m-%d %H:%i:%s') AS dvr_time,
      DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
      CASE 
           WHEN d.dvr_time IS NOT NULL THEN 
           CONCAT(FLOOR(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate) / 60), ':', MOD(TIMESTAMPDIFF(MINUTE, d.dvr_time, d.cdate), 60))
           ELSE ''
      END AS time_diff,
      DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
        (CASE 
          WHEN (d.dvr_time IS NOT NULL AND d.login_status=1) THEN 
          FLOOR(TIMESTAMPDIFF(HOUR, d.last_communication, d.cdate) / 24)
          ELSE ''
       END) AS down_since,
       
      d.IPAddress,
      d.dvrname,
      d.latency,
      d.cam1,
      d.cam2,
      d.cam3,
      d.cam4,
        
      CASE
        WHEN (d.recording_from != '' OR d.recording_to != '') THEN 'available'
        ELSE 'not available'
      END AS recording_to_status,
      d.recording_from,
      d.recording_to,
      d.dvrname,
      CASE
        WHEN d.hdd = '1' THEN 'Disk Error'
        WHEN d.hdd = '2' THEN '2 HDD'
        WHEN (d.hdd = 'no' OR d.hdd = 'No' OR d.hdd = 'Error' OR d.hdd = 'notexist' OR d.hdd = 'Not Exist' OR d.hdd='No Disk' OR d.hdd = 'No disk/idle' OR (d.recording_from = '' OR d.recording_to = '')) THEN 'Not Working'
        WHEN (d.hdd = 'Yes' OR d.hdd = 'ok' OR d.hdd = 'Normal') THEN 'Working'
        ELSE d.hdd
      END AS hdd_status
    
      FROM
      all_dvr_live d
      LEFT JOIN
      sites s ON d.IPAddress = s.DVRIP
    LEFT JOIN
      dvronline o ON d.IPAddress = o.IPAddress  
    LEFT JOIN
      dvrsite ds ON d.IPAddress = ds.DVRIP   
      WHERE
        d.live = 'Y' AND (d.hdd = 'Not Exist' OR d.hdd = 'notexist') GROUP BY d.IPAddress`;

  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});



app.get('/ExportAllSites', (req, res) => {

  let query = `
  SELECT
  dh.atmid,
  dh.ip,
  s.Bank,
  s.City,
  s.State,
  s.Zone,
  s.SiteAddress,
  dh.cam1,
  dh.cam2,
  dh.cam3,
  dh.cam4,
  dh.latency,
  CASE
      WHEN dh.hdd = 'ok' THEN 'working'
      ELSE 'not working'
  END AS hdd_status,
  CASE
      WHEN dh.login_status = 0 THEN 'working'
      ELSE 'not working'
  END AS login_status, 
  dh.dvrtype,
  DATE_FORMAT(dh.cdate, '%Y-%m-%d %H:%i:%s') AS cdate,
  DATE_FORMAT(dh.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication,
  DATE_FORMAT(dh.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,
  DATE_FORMAT(dh.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to,

  psnr.http_port AS http_port_status,
  psnr.sdk_port AS sdk_port_status,
  psnr.router_port AS router_port_status,
  psnr.rtsp_port AS rtsp_port_status,
  psnr.ai_port AS ai_port_status
FROM
  dvr_health dh
JOIN
  sites s
ON
  dh.atmid = s.ATMID
LEFT JOIN
  port_status ps
ON
  dh.atmid = ps.ATMID
LEFT JOIN (
  SELECT
      site_id,
      MAX(rectime) AS latest_rectime
  FROM
      port_status_network_report
  GROUP BY
      site_id
) AS latest_status
ON
  ps.site_sn = latest_status.site_id
LEFT JOIN port_status_network_report psnr
ON
  ps.site_sn = psnr.site_id
  AND latest_status.latest_rectime = psnr.rectime
`;
  pool.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching DVR health data for export:', err);
      res.status(500).json({ error: 'Error fetching DVR health data for export' });
    } else {
      res.status(200).json({ data: result });
    }
  });
});



app.get('/newallsites_api_dvrwise', (req, res) => {
  const { limit, offset, atmid } = req.query;
  // d.dvr_time IS NOT NULL AND d.login_status=1
  let query = `
  SELECT d.dvrname , count(1) FROM all_dvr_live d LEFT JOIN sites s ON d.IPAddress = s.DVRIP 
  LEFT JOIN dvronline o ON d.IPAddress = o.IPAddress LEFT JOIN dvrsite ds ON d.IPAddress = ds.DVRIP 
  WHERE d.live = 'Y' GROUP BY d.dvrname    `;

  const countQuery = `
  SELECT COUNT(DISTINCT(d.dvrname)) FROM all_dvr_live d LEFT JOIN sites s ON d.IPAddress = s.DVRIP 
  LEFT JOIN dvronline o ON d.IPAddress = o.IPAddress LEFT JOIN dvrsite ds ON d.IPAddress = ds.DVRIP 
  WHERE d.live = 'Y' GROUP BY d.dvrname
      `;

  const countOnlineQuery = `
  SELECT COUNT(DISTINCT(d.dvrname)) FROM all_dvr_live d LEFT JOIN sites s ON d.IPAddress = s.DVRIP 
  LEFT JOIN dvronline o ON d.IPAddress = o.IPAddress LEFT JOIN dvrsite ds ON d.IPAddress = ds.DVRIP 
  WHERE d.live = 'Y' GROUP BY d.dvrname
      `;

  const countOfflineQuery = `
      SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      WHERE
       d.live = 'Y'
      AND d.login_status = 1 AND d.status = 1
        ${atmid ? ` AND d.ATMID LIKE '%${atmid}%'` : ''}
      `;

  // query += ` GROUP BY d.IPAddress ORDER BY d.cdate DESC LIMIT ${limit} OFFSET ${offset}`;

  pool.query(query, (error, results) => {
    if (error) throw error;

    pool.query(countQuery, (countError, countResults) => {
      if (countError) throw countError;

      const totalCount = countResults[0].count;

      pool.query(countOnlineQuery, (countOnlineError, countOnlineResults) => {
        if (countOnlineError) throw countOnlineError;

        const totalOnlineCount = countOnlineResults[0].count;

        pool.query(countOfflineQuery, (countOffError, countOffResults) => {
          if (countOffError) throw countOffError;

          const totalOfflineCount = countOffResults[0].count;

          res.json({
            data: results,
            totalCount,
            totalOnlineCount,
            totalOfflineCount,
            query
          });

        });

      });


    });
  });
});




app.listen(port, () => {
  console.log(`server is running on ${port}`)

  setInterval(async () => {
    try {
      // Make an HTTP GET request to the /copy-folder endpoint
      await axios.get('http://localhost:2001/copy-folder');
      // console.log('API called every 10 seconds');
    } catch (error) {
      // console.error('Error calling API every 10 seconds:', error.message);
    }
  }, 10000); // 10000 ms = 10 seconds
})