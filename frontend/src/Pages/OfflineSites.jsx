import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';
import { MdOutlineRefresh } from "react-icons/md";
import { IoMdArrowDropup } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";

import Header from '../Child/Header';


const OfflineSites = () => {

    const [data, setData] = useState([]);
    const [atmid, setAtmid] = useState('');
    const [exportedData,  setExportedData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [offlineSites, setOfflineSites] = useState(0);
    const itemsPerPage = 20;

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [currentPage, atmid]);

    const fetchData = async () => {
        try {
            const response = await axios.get("http://192.168.100.220:2001/offlinesites_api", {
                params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, atmid },
            });

            setData(response.data.data);
            setTotalRecords(response.data.totalCount);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    useEffect(() => {

        fetch(`http://192.168.100.220:2001/OfflineSites`)
          .then(response => response.json())
          .then(data => setOfflineSites(data.offline_count))
          .catch(error => console.error('Error fetching number of offline sites:', error));
      }, []);

      useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://192.168.100.220:2001/ExportOfflineSites`);
                setExportedData(response.data.data);
                console.log(response.data.data)
            } catch (error) {
                console.error('Error fetching data from API:', error);
            }
        };

        fetchData();
    }, []);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Offline Sites Data');
        XLSX.writeFile(wb, 'Offline_Sites.xlsx');
    };


    const handleSearch = () => {
        setCurrentPage(1);
        fetchData();
    };

    const handlePagination = (newPage) => {
        setCurrentPage(newPage);
    };

    const renderPagination = () => {
        const pageCount = Math.ceil(totalRecords / itemsPerPage);

        if (pageCount <= 1) {
            return null;
        }

        const renderEllipsis = (key) => (
            <Pagination.Ellipsis key={key} disabled />
        );

        const renderPageItem = (pageNumber, key) => (
            <Pagination.Item
                key={key}
                active={currentPage === pageNumber}
                onClick={() => handlePagination(pageNumber)}
            >
                {pageNumber}
            </Pagination.Item>
        );

        const renderPaginationItems = () => {
            const pageItems = [];
            const maxPagesToShow = 5;
            const startPage = Math.max(1, currentPage - maxPagesToShow);
            const endPage = Math.min(pageCount, currentPage + maxPagesToShow);

            for (let i = startPage; i <= endPage; i++) {
                pageItems.push(renderPageItem(i, i));
            }

            return pageItems;
        };

        return (
            <Pagination>
                {currentPage > 3 && renderEllipsis('start')}
                {renderPaginationItems()}
                {currentPage < pageCount - 2 && renderEllipsis('end')}
            </Pagination>
        );
    };

    const onRefreshDetails = async (ip,dvr_name) => {
        setLoading(true);
        
        try {
          const response = await fetch("http://192.168.100.220:2001/refresh_device_api", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ip, dvr_name }),
          });
    
          const responseData = await response.json();
          console.log("responseData", responseData);
          if (response.status === 200) {
            setLoading(false);
            navigate('/NewAllSitesDetails');
            //    navigate('/NewAllSitesDetails');
          } else if (response.status === 201) {
              console.log('insert',response.status);
              let interval = setInterval(() => {
                setCount(lastTimerCount => {
                    if (lastTimerCount == 0) {
                        //your redirection to Quit screen
                        onRefreshDetails(ip, dvr_name);
                        console.log(lastTimerCount)
                        setLoading(false);
                    } else {
                        lastTimerCount <= 1 && clearInterval(interval)
                        return lastTimerCount - 1
                    }
                })
            }, 1000) //each count lasts for a second
            //cleanup the interval on complete
           
            return () => clearInterval(interval)
            
          } else if (response.status === 202) {
            setLoading(false);
            alert('Try Again');
          } else if (response.status === 203) {
            console.log('insert',response.status);
              let interval = setInterval(() => {
                setCount(lastTimerCount => {
                    if (lastTimerCount == 0) {
                        //your redirection to Quit screen
                        onRefreshDetails(ip, dvr_name);
                        console.log(lastTimerCount)
    
                    } else {
                        lastTimerCount <= 1 && clearInterval(interval)
                        console.log(lastTimerCount)
                        return lastTimerCount - 1
                    }
                })
            }, 1000) //each count lasts for a second
            //cleanup the interval on complete
            setLoading(false);
            return () => clearInterval(interval);
            
           
          } else {
            setLoading(false);
            alert('Facing Some Issue');
          }
        } catch (error) {
          setLoading(false);
          console.error("Error logging in:", error);
          // Optionally, display an error message to the user
        }
      }

    return (
        <div>
        <Header/>
        {
          loading ? (
          <div className="loader-container">
          <div className="loader"></div>
          </div>
              ) : (  
        <div className="container-fluid">
            <div className='header-sec'>
                <span className='first'>Offline Sites</span>
                <span className='second'>Total Devices Down : {offlineSites} </span>

                <button className='btn btn-primary' onClick={exportToExcel}>Download excel</button>

                <div class="input-box">
                    <i class="uil uil-search"></i>
                    <input type="text" placeholder="Search here..." value={atmid}
                        onChange={(e) => setAtmid(e.target.value)} />
                    <button class="button" onClick={handleSearch}>Search</button>
                </div>
            </div>


            <div className="table-container">
              <Table bordered responsive className="table1">
                <thead>
                  <tr>
                    <th>SRNO</th>
                    <th>ATMID</th>
                    <th>BANK</th>
                    <th>CUSTOMER</th>
                    <th>CITY</th>
                    <th>STATE</th>
                    <th>BRANCH ADDRESS</th>
                    <th>ZONE</th>
                    {/* <th>LIVE</th> */}
                    <th>DVR STATUS</th>
                    <th>PING STATUS</th>
                    <th>DVR TIME</th>
                    <th>CDATE</th>
                    <th>TIME DIFF (HH:MM)</th>
                    <th>LAST COMMUNICATION</th>
                    <th>DOWN SINCE (Days)</th>
                    <th>DVR NAME</th>
                    <th>IP</th>
                    <th>HDD</th>
                    <th>REC</th>
                    <th>CAM STATUS</th>
                    <th>HTTP</th>
                    <th>RTSP</th>
                    <th>SDK</th>
                    <th>AI</th>
                    <th>REC FROM</th>
                    <th>REC TO</th>
                    <th>Site Type</th>
                    <th>REFRESH</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((users, index) => (
                    <tr key={users.ATMID}>
                      <td>{index + 1}</td>
                      <td style={{ color: "darkblue", fontWeight: "bold" }}>
                        <Link
                          to={`/DeviceHistory/${users.IPAddress}`}
                          style={{
                            textDecoration: "none",
                            color: "darkblue",
                          }}
                        >
                          {users.ATMID}
                        </Link>
                      </td>
                      <td style={{ color: "teal", fontWeight: "bold" }}>
                        {users.Bank}
                      </td>
                      <td style={{ color: "blue", fontWeight: "bold" }}>
                        {users.Customer}
                      </td>
                      <td style={{ fontWeight: "bold" }}>{users.City}</td>
                      <td style={{ fontWeight: "bold" }}> {users.State}</td>
                      <td
                        className="testtd"
                        style={{
                          color: "black",
                          fontWeight: "bold",
                        }}
                      >
                        {users?.SiteAddress}
                      </td>
                      <td style={{ fontWeight: "bold" }}>{users.Zone}</td>
                      {/* <td>
                        {users.login_status === "working" ? (
                          <IoMdArrowDropup
                            style={{
                              color: "green",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdown
                            style={{
                              color: "red",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        )}
                      </td> */}

                      {users?.dvr_status == "Online" ? (
                        <td style={{ color: "green", fontWeight: "bold" }}>
                          {users?.dvr_status}
                        </td>
                      ) : (
                        <td style={{ color: "red", fontWeight: "bold" }}>
                          {users?.dvr_status}
                        </td>
                      )}

                      {users?.ping_status == "Online" ? (
                        <td style={{ color: "green", fontWeight: "bold" }}>
                          {users?.ping_status}
                        </td>
                      ) : (
                        <td style={{ color: "red", fontWeight: "bold" }}>
                          {users?.ping_status}
                        </td>
                      )}
                      
                      <td>{users?.dvr_time}</td>
                      <td style={{ color: "maroon", fontWeight: "bold" }}>
                        {users.cdate}
                      </td>
                      <td>{users?.time_diff}</td>
                      
                      <td style={{ color: "maroon", fontWeight: "bold" }}>
                        {users.last_communication}
                      </td>
                      <td>{users?.down_since}</td>

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users.dvrname}
                      </td>

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users.IPAddress}
                      </td>
                      
                      <td>
                        {users.hdd_status === "working" ? (
                          <IoMdArrowDropup
                            style={{
                              color: "green",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdown
                            style={{
                              color: "red",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        )}
                      </td>
                      <td>
                        {users.recording_to_status === "available" ? (
                          <span style={{ color: "green", fontWeight: 600 }}>R</span>
                        ) : (
                          <span style={{ color: "red", fontWeight: 600 }}>R</span>
                        )}
                      </td>
                      <td>
                        {["cam1", "cam2", "cam3", "cam4"].map((camera, i) => (
                          <span
                            key={i}
                            className="camera-status"
                            style={{
                              backgroundColor:
                                users[camera] === "working" ? "green" : "red",
                            }}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </td>

                      <td
                        style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                      >
                        {users.http_port === "working" ? (
                          <IoMdArrowDropup
                            style={{
                              color: "green",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdown
                            style={{
                              color: "red",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        )}
                        {/* <IoMdArrowDropup /> */}
                      </td>
                      <td
                        style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                      >
                        {users.rtsp_port === "working" ? (
                          <IoMdArrowDropup
                            style={{
                              color: "green",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdown
                            style={{
                              color: "red",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        )}
                        {/* <IoMdArrowDropup /> */}
                      </td>
                      <td
                        style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                      >
                        {users.sdk_port === "working" ? (
                          <IoMdArrowDropup
                            style={{
                              color: "green",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdown
                            style={{
                              color: "red",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        )}
                        {/* <IoMdArrowDropup /> */}
                      </td>
                      <td
                        style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                      >
                        {users.ai_port === "working" ? (
                          <IoMdArrowDropup
                            style={{
                              color: "green",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        ) : (
                          <IoMdArrowDropdown
                            style={{
                              color: "red",
                              fontWeight: 600,
                              fontSize: "15px",
                            }}
                          />
                        )}
                        {/* <IoMdArrowDropup /> */}
                      </td>

                      <td style={{ color: "maroon", fontWeight: "bold" }}>
                        {users.recording_from}
                      </td>
                      <td style={{ color: "maroon", fontWeight: "bold" }}>
                        {users.recording_to}
                      </td>
                      <td style={{ color: "maroon", fontWeight: "bold" }}>
                        {users.project}
                      </td>
                      <td
                        style={{
                          color: "darkblue",
                          fontWeight: "bold",
                          fontSize: "15px",
                        }}
                      >
                        <MdOutlineRefresh onClick={() => onRefreshDetails(users.IPAddress,users.dvrname)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {renderPagination()}
            </div>
        </div>
         )
        }
        </div>
    )
}

export default OfflineSites;
