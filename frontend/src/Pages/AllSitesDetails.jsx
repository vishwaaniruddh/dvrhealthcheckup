import React, { useState, useEffect } from "react";
import { Table } from "react-bootstrap";
import axios from "axios";
import Pagination from "react-bootstrap/Pagination";
import { Link } from "react-router-dom";
import { MdOutlineRefresh } from "react-icons/md";
import { IoMdArrowDropup } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AllSitesDetails = () => {
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
  const [totOnline, setTotOnline] = useState(0);
  const [totOffline, setTotOffline] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currentPage, atmid]);

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
      const response = await axios.get("http://192.168.100.220:2001/allsites_api", {
        params,
      });

      setData(response.data.data);
      console.log(response.data.data);
      console.log('Total:',response.data.totalCount);
      setTotalRecords(response.data.totalCount);
      setTotOnline(response.data.totalOnlineCount);
      var dvrOfflineCount = response.data.totalCount - response.data.totalOnlineCount;
      setTotOffline(dvrOfflineCount);

      var tR = response.data.totalCount;
      if (selectedOption == "") {
        var t = Math.ceil(tR / itemsPerPage);
      } else {
        var t = Math.ceil(tR / selectedOption);
      }
      setTotl(t);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchExportData();
  }, []);

  const fetchExportData = async () => {
    try {
      const response = await axios.get(
        "http://192.168.100.220:2001/allsitesexport_api",
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
      setTotl(t);
      setExportData(response.data.data);
      console.log("setExportData", response.data.data.length);
      setTotal(response.data.totalCount);
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
        const response = await axios.get("http://192.168.100.220:2001/allsites_api", {
          params: {
            limit: event.target.value,
            offset: (currentPage - 1) * event.target.value,
            atmid,
          },
        });
        var ls = response.data.totalCount;
        var t = Math.ceil(ls / event.target.value);
        setTotl(t);
        setData(response.data.data);
        console.log(response);
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

    saveAs(blob, "data.xlsx");
  };

  return loading ? (
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
          Total Devices : Online <span style={{ color: "green" }}>{totOnline}</span>Offline :{" "}
          <span style={{ color: "red" }}>{totOffline}</span>
        </span>
        <button onClick={exportToExcel} className="btn btn-primary">
          Download excel
        </button>

        <div>
          <span className="second">Select Page</span>
          <select
            // defaultValue={itemsPerPage}
            style={{ width: 100 }}
            value={selectedOption== "" ? itemsPerPage : selectedOption }
            onChange={handleDropdownChange}
          >
            {/* <option value="select">select</option> */}
            <option disabled={data?.length < 10 ? true : false} value="10">
              10
            </option>
            <option
              disabled={data?.length < 10 ? true : false}
              value="20"
            >
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
              <th>CITY</th>
              <th>STATE</th>
              <th>BRANCH ADDRESS</th>
              <th>ZONE</th>
              <th>LIVE</th>
              <th>IP</th>
              <th>LAST COMMUNICATION</th>
              <th>DEV</th>
              <th>DIFF</th>
              <th>HDD</th>
              <th>REC</th>
              <th>CAM STATUS</th>
              <th>HTTP</th>
              <th>RTSP</th>
              <th>SDK</th>
              <th>AI</th>
              <th>REC FROM</th>
              <th>REC TO</th>
              <th>REFRESH</th>
            </tr>
          </thead>
          <tbody>
            {data.map((users, index) => (
              <tr key={users.atmid}>
                <td>{index + 1}</td>
                <td style={{ color: "darkblue", fontWeight: "bold" }}>
                  <Link
                    to={`/DeviceHistory/${users.atmid}`}
                    style={{
                      textDecoration: "none",
                      color: "darkblue",
                    }}
                  >
                    {users.atmid}
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
                <td>
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
                </td>
                <td style={{ color: "black", fontWeight: "bold" }}>
                  {users.ip}
                </td>
                <td style={{ color: "maroon", fontWeight: "bold" }}>
                  {users.last_communication}
                </td>
                <td style={{ color: "maroon", fontWeight: "bold" }}>
                  {users.cdate}
                </td>
                <td>diff</td>
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
                  <IoMdArrowDropup />
                </td>
                <td
                  style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                >
                  <IoMdArrowDropup />
                </td>
                <td
                  style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                >
                  <IoMdArrowDropup />
                </td>
                <td
                  style={{ color: "green", fontWeight: 600, fontSize: "15px" }}
                >
                  <IoMdArrowDropup />
                </td>

                <td style={{ color: "maroon", fontWeight: "bold" }}>
                  {users.recording_from}
                </td>
                <td style={{ color: "maroon", fontWeight: "bold" }}>
                  {users.recording_to}
                </td>
                <td
                  style={{
                    color: "darkblue",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  <MdOutlineRefresh />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default AllSitesDetails;
