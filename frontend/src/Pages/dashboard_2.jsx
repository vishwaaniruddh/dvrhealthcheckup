import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, Button } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import Header from '../Child/Header';

const Dashboard = () => {
  const navigate = useNavigate();
  const [totalSites, setTotalSites] = useState(0);
  const [onlineSites, setOnlineSites] = useState(0);
  const [offlineSites, setOfflineSites] = useState(0);
  const [dvrofflineSites, setDVROfflineSites] = useState(0);
  const [netonlineSites, setnetOnlineSites] = useState(0);
  const [netofflineSites, setnetOfflineSites] = useState(0);
  const [hddNotWorking, sethddNotWorking] = useState(0);
  const [notExist, setnotExist] = useState(0);
  const [noDisk, setnoDisk] = useState(0);
  const [hddError, sethddError] = useState(0);
  const [hddOne, sethddOne] = useState(0);
  const [hddUnformatted, sethddUnformatted] = useState(0);
  const [hddAbnormal, sethddAbnormal] = useState(0);
  const [cameraNotWorking, setCameraNotWorking] = useState(0)
  const [neveron, setNeveron] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hddcalllog, setHddCallLog] = useState([]);
  const [currentcdate, setCurrentCdate] = useState(0);
  const [rtspNotWorking, setRtspNotWorking] = useState([]);
  const [sdkNotWorking, setSdkNotWorking] = useState([]);
  const [aiNotWorking, setAiNotWorking] = useState([]);
  const [routerNotWorking, setRouterNotWorking] = useState([]);
  const [httpNotWorking, setHttpNotWorking] = useState([]);
  const [recNotAvailable, setrecNotAvailable] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [customerWiseStatus, setCustomerWiseStatus] = useState([]);



  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    var user_details = localStorage.getItem('uid');
    console.log('user_details', user_details);
    if (!user_details || user_details == '') {
      navigate('/Login');
    }

    const fetchData = () => {

      axios.get(`"http://192.168.100.220:2001/todayshddstatuschange`)
        .then((response) => {
          console.log('Data from API:', response.data);
          setHddCallLog(response.data);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
        });
    };
    fetchData();
  }, []);

  useEffect(() => {
    function updateDateTime() {
      setCurrentDate(new Date());
    }
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const formattedDate = currentDate.toLocaleDateString();
  const formattedTime = currentDate.toLocaleTimeString();

  useEffect(() => {
    setLoading(true);
    fetch("http://192.168.100.220:2001/TotalSites")
      .then(response => response.json())
      .then(data => {
        setTotalSites(data.atmCount)
        setLoading(false);
      })
      .catch(error => { setLoading(false), console.error('Error fetching total number of sites:', error) });

  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/CameraNotWorking")
      .then(response => response.json())
      .then(data => setCameraNotWorking(data.totalCount))
      .catch(error => console.error('Error fetching total number of sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/OnlineSites")
      .then(response => response.json())
      .then(data => setOnlineSites(data.online_count))
      .catch(error => console.error('Error fetching number of online sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/OfflineSites")
      .then(response => response.json())
      .then(data => setOfflineSites(data.offline_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/DVROfflineSites")
      .then(response => response.json())
      .then(data => setDVROfflineSites(data.offline_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/NetOnlineSites")
      .then(response => response.json())
      .then(data => setnetOnlineSites(data.net_online_count))
      .catch(error => console.error('Error fetching number of online sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/NetOfflineSites")
      .then(response => response.json())
      .then(data => setnetOfflineSites(data.net_offline_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddnotworking")
      .then(response => response.json())
      .then(data => sethddNotWorking(data.non_ok_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddnoDisk")
      .then(response => response.json())
      .then(data => setnoDisk(data.no_disk_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);


  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddnotExist")
      .then(response => response.json())
      .then(data => setnotExist(data.not_exist_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);


  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddError")
      .then(response => response.json())
      .then(data => sethddError(data.error_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);


  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddOne")
      .then(response => response.json())
      .then(data => sethddOne(data.one_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);


  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddUnformatted")
      .then(response => response.json())
      .then(data => sethddUnformatted(data.unformatted_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/hddAbnormal")
      .then(response => response.json())
      .then(data => sethddAbnormal(data.abnormal_hdd_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/current_cdate")
      .then(response => response.json())
      .then(data => setCurrentCdate(data.cdate))
      .catch(error => console.error('Error fetching cdate:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/neveron")
      .then(response => response.json())
      .then(data => setNeveron(data.neveron))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  // useEffect(() => {
  //   fetch("http://192.168.100.220:2001/hddnotworking_count_new")
  //     .then(response => response.json())
  //     .then(data => setHDDNotWorking(data.non_ok_hdd_count))
  //     .catch(error => console.error('Error fetching number of offline sites:', error));
  // }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/rtsp_not_working_count")
      .then(response => response.json())
      .then(data => setRtspNotWorking(data.record_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch("http://192.168.100.220:2001/sdk_not_working_count")
      .then(response => response.json())
      .then(data => setSdkNotWorking(data.record_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);
  useEffect(() => {

    fetch(`http://192.168.100.220:2001/ai_not_working_count`)
      .then(response => response.json())
      .then(data => setAiNotWorking(data.record_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  useEffect(() => {
    fetch(`http://192.168.100.220:2001/router_not_working_count`)
      .then(response => response.json())
      .then(data => setRouterNotWorking(data.record_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);




  useEffect(() => {
    getHttpData();
  }, [])


  const getHttpData = async () => {
    await fetch(`http://192.168.100.220:2001/http_not_working_count`)
      .then(response => response.json())
      .then(data => {
        console.log('data', data)
        setHttpNotWorking(data.record_count)
      })
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }

  // useEffect(() => {
  //   fetch(`http://192.168.100.220:2001/http_not_working_count`)
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log('data', data)
  //       setHttpNotWorking(data.record_count)
  //     })
  //     .catch(error => console.error('Error fetching number of offline sites:', error));
  // }, []);

  useEffect(() => {
    fetch(`http://192.168.100.220:2001/rec_not_available_count`)
      .then(response => response.json())
      .then(data => setrecNotAvailable(data.not_available_count))
      .catch(error => console.error('Error fetching number of offline sites:', error));
  }, []);

  function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-indexed, so we add 1
    const year = date.getFullYear();

    // Pad single digit day and month with leading zeros
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month).padStart(2, '0');

    return `${formattedDay}-${formattedMonth}-${year}`;
  }

  // Get today's date
  const today = new Date();

  // Format the date
  const formattedTodaysDate = formatDate(today);


  const [customerData, setCustomerData] = useState([]);

  useEffect(() => {
    fetch(`http://192.168.100.220:2001/fetch_status_customer_wise`)  // Adjusted the endpoint
      .then(response => response.json())
      .then(data => setCustomerData(data.data))  // Set the fetched data
      .catch(error => console.error('Error fetching customer status:', error));
  }, []);


  return (
    <div>
      <Header />
      {
        loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className='container-fluid center '>
            <div className='d-flex flex-row justify-content-between '>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>Allocations dashboard</span>
              <p style={{ fontSize: "14px", fontWeight: "700" }}>Dashboard as on date: {formattedDate}, {formattedTime}</p>
            </div>
            <table className="table table-bordered  table2 mt-2">
              <tr>
                <th ></th>
                <th colSpan="4">Sites</th>
                <th>Checktime</th>
                <th></th>
                <th colSpan="4">HDD</th>
                {/* <th colSpan="5">Device Failures</th> */}
              </tr>
              <tr>
                <td>GROUP</td>
                <td>TOTAL</td>
                <td>NETWORK</td>
                <td>DVR</td>

                <td>NEVER ON</td>
                <td>TODAYS DATE</td>
                <td></td>
                <td>TOTAL HDD NW</td>
                <td colSpan="3">HDD Status</td>

                {/* <td>CAMERA</td>
                <td>DISC</td>
                <td>HDD CALL LOG</td>
                <td>RECORD</td>
                <td>TIME</td> */}
              </tr>
              <tr>
                <td style={{ color: "darkslateblue", fontWeight: "700" }}><Link to="/NewAllSitesDetails" style={{ textDecoration: "none", color: "inherit" }}>All Sites</Link></td>
                <td>{totalSites}</td>
                <td style={{ fontWeight: "700" }}>
                  <span style={{ textDecoration: "none", color: "black" }}>Online/Offline</span>
                  {"\n"}
                  <Link to="/NetOnlineSites" style={{ textDecoration: "none", color: "green" }}>
                    {netonlineSites}
                  </Link>
                  /
                  <Link to="/NetOfflineSites" style={{ textDecoration: "none", color: "red" }}>
                    {netofflineSites}
                  </Link>
                </td>

                {/* <td style={{ color: "green", fontWeight: "700" }}><Link to="/NetOnlineSites" style={{ textDecoration: "none", color: "inherit" }}>{netonlineSites}</Link></td>
                <td style={{ color: "red", fontWeight: "700" }}><Link to="/NetOfflineSites" style={{ textDecoration: "none", color: "inherit" }}>{netofflineSites}</Link></td> */}

                <td style={{ fontWeight: "700" }}>

                  <table border="1" cellPadding="3" cellSpacing={0} width="100%">
                    <tr>
                      <td>Login</td>
                      <td>
                        <Link to="/OnlineSites" style={{ textDecoration: "none", color: "green" }}>
                          {onlineSites}
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td>Not Login</td>
                      <td>
                        <Link to="/OfflineSites" style={{ textDecoration: "none", color: "green" }}>
                          {dvrofflineSites}
                        </Link>
                      </td>
                    </tr>

                  </table>
                  {/* /
                  <Link to="/DVROfflineSites" style={{ textDecoration: "none", color: "red" }}>
                  {dvrofflineSites}
                  </Link> */}
                </td>
                {/*                 
                <td style={{ color: "green", fontWeight: "700" }}><Link to="/OnlineSites" style={{ textDecoration: "none", color: "inherit" }}>{onlineSites}</Link></td>
                <td style={{ color: "red", fontWeight: "700" }}><Link to="/OfflineSites" style={{ textDecoration: "none", color: "inherit" }}>{offlineSites}</Link></td>
                <td style={{ color: "red", fontWeight: "700" }}><Link to="/DVROfflineSites" style={{ textDecoration: "none", color: "inherit" }}>{dvrofflineSites}</Link></td>
                 */}
                <td style={{ color: "red", fontWeight: "700" }}>
                  <Link to="/NeverOnSites" style={{ textDecoration: "none", color: "inherit" }}>
                    {neveron}
                  </Link>
                </td>
                <td>{currentcdate}</td>
                <td></td>
                {/* <td>{formattedTodaysDate}</td> */}
                <td style={{ color: "red", fontWeight: "700" }}>
                  <Link to="/HddNotWorkingSites" style={{ textDecoration: "none", color: "inherit" }}>
                    {hddNotWorking}
                  </Link>
                </td>

                <td style={{ fontWeight: "700" }}>
                  <span style={{ textDecoration: "none", color: "black" }}>No Disk/NotExist</span>
                  {"\n"}
                  <Link to="/HddNoDisk" style={{ textDecoration: "none", color: "red" }}>
                    {noDisk}
                  </Link>
                  /
                  <Link to="/HddNotExist" style={{ textDecoration: "none", color: "red" }}>
                    {notExist}
                  </Link>
                </td>

                <td style={{ fontWeight: "700" }}>
                  <span style={{ textDecoration: "none", color: "black" }}>Error/1</span>
                  {"\n"}
                  <Link to="/HddError" style={{ textDecoration: "none", color: "red" }}>
                    {hddError}
                  </Link>
                  /
                  <Link to="/HddOne" style={{ textDecoration: "none", color: "red" }}>
                    {hddOne}
                  </Link>
                </td>

                <td style={{ fontWeight: "700" }}>
                  <span style={{ textDecoration: "none", color: "black" }}>Unformatted/Abnormal</span>
                  {"\n"}
                  <Link to="/HddUnformatted" style={{ textDecoration: "none", color: "red" }}>
                    {hddUnformatted}
                  </Link>
                  /
                  <Link to="/HddAbnormal" style={{ textDecoration: "none", color: "red" }}>
                    {hddAbnormal}
                  </Link>
                </td>

                {/* <td>{cameraNotWorking}</td>
                <td style={{ color: "red", fontWeight: "700" }}><Link to="/HddNotWorkingSites" style={{ textDecoration: "none", color: "inherit" }}>{hddNotWorking}</Link></td>
                <td><p
                  className='ml-3'
                  style={{ color: 'red', fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={handleOpenModal}
                >
                    view
                </p></td>
                <td style={{ color: "red", fontWeight: "700" }}>
                  <Link to="/RecNotAvailable" style={{ textDecoration: "none", color: "inherit" }}>
                  {recNotAvailable}
                  </Link>
                </td>
                <td>88</td>  */}
              </tr>
            </table>


            <div>
              <h1>Customer Wise Status</h1>
              {customerData.length > 0 ? (
                <table class="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Total Online Network</th>
                      <th>Total Offline Network</th>
                      <th>Total Online DVR</th>
                      <th>Total DVR Not Login</th>
                      <th>Total Offline DVR</th>
                      <th>Total Never ON</th>
                      <th>Total HDD NW</th>
                      {/* <th>Total HDD Status</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.map(customer => (
                      <tr key={customer.customer}>
                        <td>{customer.customer}</td>
                        <td>{customer.total}</td>
                        <td>{customer.total_online_network}</td>
                        <td>{customer.total_offline_network}</td>
                        <td>{customer.total_online_dvr}</td>
                        <td>{customer.total_dvr_notlogin}</td>
                        <td>{customer.total_offline_dvr}</td>
                        <td>{customer.total_never_on}</td>
                        <td>{customer.total_hdd_notworking}</td>
                        {/* <td>{customer.total_hdd_notworking}</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>No data available</div>
              )}
            </div>
            <Modal show={showModal} onHide={handleCloseModal}>
              <Modal.Header closeButton>
                <Modal.Title>Today HDD Not Working</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ATM ID</th>
                      <th>Previous Status</th>
                      <th>Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* {hddcalllog.map((item) => (
                      <tr key={item.atmid}>
                        <td style={{ color: 'darkblue', fontWeight: 'bold', fontSize: '13px' }} >{item.atmid}</td>
                        <td style={{ color: 'green', fontWeight: 'bold', fontSize: '13px' }}>{item.previous_status}</td>
                        <td style={{ color: 'red', fontWeight: 'bold', fontSize: '13px' }}>{item.current_status}</td>
                      </tr>
                    ))} */}
                  </tbody>
                </Table>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        )
      }
    </div>
  )
}

export default Dashboard