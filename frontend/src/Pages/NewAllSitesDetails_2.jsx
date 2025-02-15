import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";
import axios from "axios";
import Pagination from "react-bootstrap/Pagination";
import { Link } from "react-router-dom";
import { MdOutlineRefresh } from "react-icons/md";
import { IoMdArrowDropup } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import Header from '../Child/Header';

const NewAllSitesDetails = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [exportdata, setExportData] = useState([]);
  const [atmid, setAtmid] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [totl, setTotl] = useState(1);
  const [online, setOnline] = useState(0);
  const [offline, setOffline] = useState(0);
  const [isSetTime, setTim] = useState(0);
  const [count, setCount] = useState(60);
  // useEffect(() => {
  //   fetchData();
  // }, [currentPage, atmid]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);


  const fetchData = async () => {
    if (selectedOption == "") {
      var params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        atmid,
      };
    } else {
      var params = {
        limit: selectedOption,
        offset: (currentPage - 1) * selectedOption,
        atmid,
      };
    }

    setLoading(true);
    try {
      const response = await axios.get(
        "http://192.168.100.220:2001/newallsites_api",
        {
          params,
        }
      );

      setData(response.data.data);
      console.log('response-->', response.data.data);
      setTotalRecords(response.data.totalCount);
      console.log("tot_cnt", response.data.totalCount);

      console.log("query", response.data.query);

      var tR = response.data.totalCount;
      console.log("sel", selectedOption);
      if (selectedOption == "") {
        console.log("items", itemsPerPage);
        var t = Math.ceil(tR / itemsPerPage);
      } else {
        var t = Math.ceil(tR / selectedOption);
      }
      setTotl(t);

      var onList = response?.data?.totalOnlineCount;
      var offList = response?.data?.totalOfflineCount;
      //var offList = tR-onList;
      console.log('offList', offList)
      setOffline(offList);
      setOnline(onList);

      console.log("onList", onList)

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const onLogout = async () => {
    // var user_details = localStorage.getItem('uid');
    // console.log('user_details', user_details);
    localStorage.setItem('uid', '');
    localStorage.setItem('uname', '');
    navigate('/Login');
  }

  useEffect(() => {
    var user_details = localStorage.getItem('uid');
    console.log('user_details', user_details);
    if (!user_details) {
      navigate('/Login');
    }
    fetchExportData();
  }, []);

  const fetchExportData = async () => {
    try {
      const response = await axios.get(
        "http://192.168.100.220:2001/newallsitesexport_api",
        {
          params: {
            atmid,
          },
        }
      );
      var tR = response.data.totalCount;
      if (selectedOption == "") {
        var t = Math.ceil(tR / itemsPerPage);
      } else {
        var t = Math.ceil(tR / selectedOption);
      }
      // setTotl(t);
      setExportData(response.data.data);
      console.log("setExportData", response.data.data.length);
      // setTotal(response.data.totalCount);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handlePagination = (newPage) => {
    setCurrentPage(newPage);
    console.log("newPage", newPage);
    if (selectedOption == "") {
      var t = Math.ceil(totalRecords / itemsPerPage);
    } else {
      var t = Math.ceil(totalRecords / selectedOption);
    }
    setTotl(t);
  };

  const renderPagination = () => {
    const pageCount = Math.ceil(totalRecords / itemsPerPage);

    if (selectedOption == "") {
      if (totl > currentPage) {
        var l_no = Math.ceil(totalRecords / itemsPerPage);
      } else {
        var l_no = 1;
      }
    } else if (currentPage < totl) {
      var l_no = Math.ceil(totalRecords / selectedOption);
    } else {
      var l_no = 1;
    }

    if (pageCount <= 1) {
      return null;
    }

    const renderFirst = (key) => (
      <Pagination.First key={key} onClick={() => handlePagination(1)} />
    );

    const renderLast = (key) => (
      <Pagination.Last
        key={key}
        disabled={currentPage >= totl ? true : false}
        onClick={() => handlePagination(l_no)}
      />
    );

    const renderEllipsis = (key) => <Pagination.Ellipsis key={key} disabled />;

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
      console.log("startPage,endPage", startPage, endPage);

      for (let i = startPage; i <= endPage; i++) {
        pageItems.push(renderPageItem(i, i));
      }

      return pageItems;
    };

    return (
      <Pagination>
        {renderFirst("first")}
        {currentPage > 3 && renderEllipsis("start")}
        {renderPaginationItems()}
        {currentPage < pageCount - 2 && renderEllipsis("end")}
        {renderLast("last")}
      </Pagination>
    );
  };

  const handleDropdownChange = async (event) => {
    setSelectedOption(event.target.value);
    if (event.target.value == "select") {
      setLoading(false);
    } else {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://192.168.100.220:2001/newallsites_api",
          {
            params: {
              limit: event.target.value,
              offset: (currentPage - 1) * event.target.value,
              atmid,
            },
          }
        );
        var ls = response.data.totalCount;
        var t = Math.ceil(ls / event.target.value);
        setTotl(t);
        setData(response.data.data);
        console.log("response_limit->", response.data.data);
        console.log("response1_limit->", response.data.totalCount);
        setTotalRecords(response.data.totalCount);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  const exportToExcel = () => {
    console.log("exportdata", exportdata);
    const worksheet = XLSX.utils.json_to_sheet(exportdata);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Buffer to store the generated Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "DVR Health Report.xlsx");
  };

  const onRefreshDetails = async (ip, dvr_name) => {
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
      debugger;
      if (response.status === 200) {
        setLoading(false);
        navigate('/NewAllSitesDetails');
        //    navigate('/NewAllSitesDetails');
      } else if (response.status === 201) {
        console.log('insert', response.status);
        let interval = setInterval(() => {
          setCount(lastTimerCount => {
            console.log("lastTimerCount : ",lastTimerCount)
            if (lastTimerCount == 1) {
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
        console.log('insert', response.status);
        let interval = setInterval(() => {
          setCount(lastTimerCount => {
            if (lastTimerCount == 1) {
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
      <Header />
      {
        loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="container-fluid">
            <div className="header-sec">
              <span className="first" style={{ color: "darkslateblue" }}>
                All View
              </span>
              <span className="second">
                Total Devices : Up <span style={{ color: "green" }}>{online}</span>Down :{" "}
                <span style={{ color: "red" }}>{offline}</span>
              </span>
              <button onClick={exportToExcel} className="btn btn-primary">
                Download excel
              </button>

              <div>
                <span className="second">Select Page</span>
                <select
                  // defaultValue={itemsPerPage}
                  style={{ width: 100 }}
                  value={selectedOption == "" ? itemsPerPage : selectedOption}
                  onChange={handleDropdownChange}
                >
                  {/* <option value="select">select</option> */}
                  <option disabled={data?.length < 10 ? true : false} value="10">
                    10
                  </option>
                  <option disabled={data?.length < 10 ? true : false} value="20">
                    20
                  </option>
                  <option disabled={data?.length < 10 ? true : false} value="30">
                    30
                  </option>
                  <option disabled={data?.length < 10 ? true : false} value="40">
                    40
                  </option>
                  <option disabled={data?.length < 10 ? true : false} value="50">
                    50
                  </option>
                </select>
              </div>
              <div className="input-box">
                <i className="uil uil-search"></i>
                <input
                  type="text"
                  placeholder="Search here..."
                  value={atmid}
                  onChange={(e) => setAtmid(e.target.value)}
                />
                <button className="button" onClick={handleSearch}>
                  Search
                </button>

              </div>
            </div>

            <div>
              {renderPagination()}
              <p className="page-info">
                Page: {currentPage} of {totl}
              </p>
            </div>

            <div className="table-container">
              <Table bordered responsive className="table1">
                <thead>
                  <tr>
                    <th>SRNO</th>
                    <th>ATMID</th>
                    <th>BANK</th>
                    <th>CUSTOMER</th>

                    {/* <th>LIVE</th> */}
                    <th>DVR STATUS</th>
                    <th>PING STATUS</th>
                    <th>DVR TIME</th>
                    <th>CDATE</th>
                    <th>TIME DIFF (HH:MM)</th>
                    <th>LAST COMMUNICATION</th>
                    <th>DOWN AGING</th>
                    <th>AGING (Days)</th>
                  

                    <th>DVR NAME</th>
                    <th>IP</th>
                    <th>HDD DB</th>
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

                    <th>CITY</th>
                    <th>STATE</th>
                    <th>BRANCH ADDRESS</th>
                    <th>ZONE</th>

                    <th>ENG NAME</th>
                    <th>ENG CONTACT</th>
                    <th>ENG EMAILID</th>

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
                          target="_blank" rel="noopener noreferrer"
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
                      <td>{
                        users.down_since > 0 ? users?.down_since + '' : ''
                      }</td>

                      <td style={{ fontWeight: "bold" }}>
                        {
                          users.down_since == 0 ? '-' :
                            users.down_since > 0 && users.down_since < 2 ? '<2' :
                              users.down_since >= 2 && users.down_since < 4 ? '>2-4' :
                                users.down_since >= 4 && users.down_since < 6 ? '>4-6' :
                                  users.down_since >= 6 && users.down_since < 8 ? '>6-8' :
                                    '>8'}
                      </td>

                     

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users.dvrname}
                      </td>

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users.IPAddress}
                      </td>
                      <td style={{ color: "blue", fontWeight: "bold" }}>
                        {users.hdd_db}
                      </td>
                      <td>
                        {users.dvr_status === "Online" ? (
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
                        {users.dvr_status === "Online" ? (
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
                                users.dvr_status == 'Offline' ? 'red' :
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
                        {
                          users.dvr_status == 'Offline' ? '' : users.recording_from}
                      </td>

                      <td style={{ color: "maroon", fontWeight: "bold" }}>
                        {users.dvr_status == 'Offline' ? '' : users.recording_to}
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
                        <MdOutlineRefresh onClick={() => onRefreshDetails(users.IPAddress, users.dvrname)} />
                        {/* <AiOutlineLoading3Quarters /> */}
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

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users?.eng_name}
                      </td>

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users?.eng_contact}
                      </td>

                      <td style={{ color: "black", fontWeight: "bold" }}>
                        {users?.email_id}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )
      }
    </div>
  )
};

export default NewAllSitesDetails;
