import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { MdOutlineRefresh } from "react-icons/md";
import { IoMdArrowDropup } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Header from '../Child/Header';

const DeviceHistory = () => {
    const [data, setData] = useState(new Date().toLocaleDateString());
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportedData, setExportedData] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { atmId } = useParams();
    useEffect(() => {
        fetchData();
    }, [currentPage, startDate, endDate]);

    console.log('atmid_1', atmId);
    // setLoading(true);
    const fetchData = async () => {
        try {
            const response = await axios.get(`http://192.168.100.24:2001/devicehistoryThree/${atmId}`, {
                params: {
                    startDate: startDate || null,
                    endDate: endDate || null,
                    limit: itemsPerPage,
                    offset: (currentPage - 1) * itemsPerPage
                },
            });

            setData(response.data.data);
            // console.log(response.data.data)
            setTotalRecords(response.data.totalCount);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://192.168.100.24:2001/DeviceHistoryExport/${atmId}`);
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
        XLSX.utils.book_append_sheet(wb, ws, 'All Sites Data');
        XLSX.writeFile(wb, `dvr history for ${atmId}.xlsx`);
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

    const onRefreshDetails = async (ip, dvr_name) => {
        setLoading(true);

        try {
            const response = await fetch("http://192.168.100.24:2001/refresh_device_api", {
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
                console.log('insert', response.status);
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
            <Header />
            {
                loading ? (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <div className="container-fluid">
                        <div className='arrange'>
                            <span className="first" style={{ color: "darkslateblue", fontWeight: "600" }}>Device History</span>
                            <div className='arrange-inner'>
                                <span style={{ color: "darkslateblue", fontWeight: "600", marginTop: "4px" }}>Select Date Range :</span>
                                <div className="date-picker-container">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => {
                                            console.log("Selected Start Date:", date);
                                           // const d = new Date(date).toLocaleDateString('fr-FR');
                                            setStartDate(date.toLocaleDateString());
                                        }}
                                        className='form-control'
                                        selectsStart
                                        startDate={startDate}
                                        endDate={endDate}
                                        placeholderText="start date..."
                                       
                                    />
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => {
                                            console.log("Selected End Date:", date);
                                          //  const d = new Date(date).toLocaleDateString('fr-FR');
                                            setEndDate(date.toLocaleDateString());
                                        }}
                                        className='form-control'
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate}
                                        placeholderText="end date..."
                                       
                                    />
                                    <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                                </div>
                            </div>
                            <div>
                                <button onClick={exportToExcel} className="btn btn-success">
                                    Export to Excel
                                </button>
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
                                        {/* <th>DVR TIME</th> */}
                                        <th>CDATE</th>
                                        {/* <th>TIME DIFF (HH:MM)</th> */}
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
                                        <tr key={index}>
                                            <td>{(currentPage - 1) * 20 + (index + 1)}</td>
                                            {/* <td>{index}</td> */}
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

                                            {/* <td>{users?.dvr_time}</td> */}
                                            <td style={{ color: "maroon", fontWeight: "bold" }}>
                                                {users.cdate}
                                            </td>
                                            {/* <td>{users?.time_diff}</td> */}

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
                                                <MdOutlineRefresh onClick={() => onRefreshDetails(users.IPAddress, users.dvrname)} />
                                                {/* <AiOutlineLoading3Quarters /> */}
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
};

export default DeviceHistory;
