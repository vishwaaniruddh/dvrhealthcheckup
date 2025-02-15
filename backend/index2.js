const express = require("express")
const mysql = require('mysql')
const cors = require("cors");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express()

app.use(express.json())
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
  origin: 'http://127.0.0.1:5173'
}));



const port = 2001

const pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: '',
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

app.post('/login_user_api', (req, res) => {
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

app.get('/newallsites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT
        d.atmid,
        d.IPAddress,
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
        d.dvrname,
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
        all_dvr_live d
      LEFT JOIN
        sites s ON d.IPAddress = s.DVRIP
      WHERE
        s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      LEFT JOIN
        sites s ON d.IPAddress = s.DVRIP
      WHERE
        s.live = 'Y'
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

app.get('/newallsitesexport_api', (req, res) => {
  const { atmid } = req.query;

  let query = `
      SELECT
        d.atmid,
        d.IPAddress,
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
        d.dvrname,
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
      all_dvr_live d
      LEFT JOIN
        sites s ON d.IPAddress = s.DVRIP
      WHERE
        s.live = 'Y'
    `;

  if (atmid) {
    query += ` AND d.atmid LIKE '%${atmid}%'`;
  }

  const countQuery = `
      SELECT COUNT(*) as count
      FROM
      all_dvr_live d
      LEFT JOIN
        sites s ON d.IPAddress = s.DVRIP
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

app.get('/onlinesites_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT d.atmid,d.ip, d.cam1,d.cam2, d.cam3,d.cam4,DATE_FORMAT(d.cdate, '%Y-%m-%d %H:%i:%s') AS cdate, d.latency,DATE_FORMAT(d.recording_to, '%Y-%m-%d %H:%i:%s') AS recording_to, DATE_FORMAT(d.recording_from, '%Y-%m-%d %H:%i:%s') AS recording_from,d.dvrtype, CASE WHEN d.hdd = 'ok' THEN 'working' ELSE 'not working' END AS hdd_status, CASE WHEN d.login_status = 0 THEN 'working' ELSE 'not working' END AS login_status, DATE_FORMAT(d.last_communication, '%Y-%m-%d %H:%i:%s') AS last_communication, s.Bank, s.City, s.State, s.SiteAddress, s.Zone FROM dvr_health d LEFT JOIN sites s ON d.atmid = s.ATMID WHERE d.login_status = 0 AND s.live = 'Y'
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
        d.login_status = 0
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


app.get('/offlinesites_api', (req, res) => {
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
        s.City,
        s.State,
        s.SiteAddress,
        s.Zone
      FROM
        dvr_health d
      LEFT JOIN
        sites s ON d.atmid = s.ATMID
        WHERE
        d.login_status = 1
        AND s.live = 'Y'
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
        d.login_status = 1
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
  console.log("Incoming Request:", req.params, req.query);
  const { atmId } = req.params;
  const { limit, offset, startDate, endDate } = req.query;

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
          dvr_history d
      LEFT JOIN
          sites s ON d.atmid = s.ATMID
      WHERE
          s.live = 'Y'
          AND d.atmid = ?`;

  const queryParams = [atmId];
  if (startDate && endDate) {
    const formattedStartDate = formatDate(startDate) + ' 00:00:00';
    const formattedEndDate = formatDate(endDate) + ' 23:59:59';
    query += ` AND DATE(last_communication) BETWEEN ? AND ?`;
    queryParams.push(formattedStartDate, formattedEndDate);
    
  console.log("Formatted Start Date:", formattedStartDate);
  console.log("Formatted End Date:", formattedEndDate);
  }

  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(Number(limit), Number(offset));

  console.log("Generated SQL query:", query);
  console.log("Query parameters:", queryParams);



  const totalCountQuery = `
      SELECT COUNT(*) AS totalCount
      FROM dvr_history
      WHERE atmid = ?
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
        console.error('Error fetching history data:', error);
        res.status(500).json({ error: 'Error fetching history data' });
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
  dvr_health.atmid,
  dvr_health.ip,
  sites.CITY,
  sites.STATE,
  sites.ZONE,
  sites.Bank,
  sites.SiteAddress
FROM
  dvr_health
JOIN
  sites
ON
  dvr_health.atmid = sites.ATMID
WHERE
  dvr_health.cdate IS NULL OR dvr_health.cdate = ''
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
        d.cdate IS NULL OR d.cdate = ''
        
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


app.get('/hddnotqorking_api', (req, res) => {
  const { limit, offset, atmid } = req.query;

  let query = `
      SELECT 
    d.ip, 
    d.atmid, 
    d.cam1, 
    d.cam2, 
    d.cam3, 
    d.cam4, 
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
    dvr_health d 
JOIN 
    sites s 
ON 
    d.atmid = s.atmid 
WHERE 
    NOT (d.hdd = 'ok' OR d.hdd = 'OK') 
    AND s.live = 'Y'
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
        NOT (d.hdd = 'ok' OR d.hdd = 'OK') 
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


app.get('/hddnotworking_count', (req, res) => {
  const query = `
        SELECT COUNT(*) AS non_ok_hdd_count FROM dvr_health WHERE NOT (hdd = 'ok' OR hdd = 'OK');
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
      console.log(result)
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
  pool.query('SELECT COUNT(DISTINCT atmid) AS atmCount FROM dvr_health', (err, result) => {
    if (err) {
      console.error('Error counting ATM IDs:', err);
      res.status(500).json({ error: 'Error counting ATM IDs' });
    } else {
      const atmCount = result[0].atmCount;

      res.status(200).json({ atmCount });
    }
  });
});

app.get('/OnlineSites', (req, res) => {
  const query = `
      SELECT COUNT(*) AS online_count
      FROM dvr_health
      WHERE login_status = 0;
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
      SELECT COUNT(*) AS offline_count
      FROM dvr_health
      WHERE login_status = 1 OR login_status IS NULL;
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

app.get('/hddnotworking', (req, res) => {
  const query = `
      SELECT COUNT(*) AS non_ok_hdd_count FROM dvr_health WHERE NOT (hdd = 'ok' OR hdd = 'OK');
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
  const query = `
  SELECT COUNT(*) AS neveron FROM dvr_health WHERE cdate IS NULL OR cdate = '';
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



app.listen(port, () => {
  console.log(`server is running on ${port}`)
})