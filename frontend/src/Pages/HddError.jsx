import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import axios from 'axios';
import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';
import { MdOutlineRefresh } from "react-icons/md";
import { IoMdArrowDropup } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";


const HddError = () => {

    const [data, setData] = useState([]);
    const [atmid, setAtmid] = useState('');
    const [exportedData,  setExportedData] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [offlineSites, setOfflineSites] = useState(0);
    const [hddCount, setHddCount] = useState(0);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, [currentPage, atmid]);

    const fetchData = async () => {
        try {
            const response = await axios.get("http://192.168.100.220:2001/hdderror_api", {
                params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, atmid },
            });

            setData(response.data.data);
            console.log(response.data.data)
            setTotalRecords(response.data.totalCount);
            // console.log(response.data.totalCount)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };


    useEffect(() => {

        fetch(`http://192.168.100.220:2001/hddError`)
          .then(response => response.json())
          .then(data => setHddCount(data.error_hdd_count))
          .catch(error => console.error('Error fetching number of offline sites:', error));
      }, []);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://192.168.100.220:2001/ExportHddErrorSites`);
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
        XLSX.utils.book_append_sheet(wb, ws, 'HDD Error Sites Data');
        XLSX.writeFile(wb, 'HDD_Error_Sites.xlsx');
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

    return (
        <div className="container-fluid">
            <div className='header-sec'>
                <span className='first'>Hdd Error Sites</span>
                <span className='second'>Total Hdd Error Sites : <span style={{color:"red"}}> {hddCount} </span></span>

                {/* <button className='btn btn-primary'>Download excel</button> */}
                <button className='btn btn-primary' onClick={exportToExcel}>Download excel</button>

                <div class="input-box">
                    <i class="uil uil-search"></i>
                    <input type="text" placeholder="Search here..." value={atmid}
                        onChange={(e) => setAtmid(e.target.value)} />
                    <button class="button" onClick={handleSearch}>Search</button>
                </div>
            </div>


            <div className="table-container">
                <Table bordered responsive className='table1'>
                    <thead>
                        <tr>
                            <th>SrNo</th>
                            <th>atmid</th>
                            <th>Bank</th>
                            <th>city</th>
                            <th>state</th>
                            <th>zone</th>
                            <th>Live </th>
                            <th>Ip</th>
                            <th>Dev</th>
                            <th>last communication</th>
                            <th>hdd</th>
                            <th>No of Days</th>
                            <th>Cam Status</th>
                            <th>http </th>
                            <th>rtsp </th>
                            <th>sdk </th>
                            <th>ai </th>
                            <th></th>
                            <th>Branch Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((users, index) => (
                            <tr key={users.atmid}>
                                <td>{index + 1}</td>
                                <td style={{ color: 'darkblue', fontWeight: 'bold' }}>
                                    <Link
                                        to={`/DeviceHistory/${users.atmid}`}
                                        style={{
                                            textDecoration: 'none',
                                            color: 'darkblue',
                                        }}
                                    >
                                        {users.atmid}
                                    </Link>
                                </td>
                                <td style={{ color: 'teal', fontWeight: "bold" }}>{users.Bank}</td>
                                <td style={{ fontWeight: "bold" }}>{users.city}</td>
                                <td style={{ fontWeight: "bold" }}> {users.state}</td>
                                <td style={{ fontWeight: "bold" }}>{users.zone}</td>
                                <td>
                                    {users.login_status === 'working' ? (
                                        <IoMdArrowDropup style={{ color: 'green', fontWeight: 600, fontSize: '15px' }} />
                                    ) : (
                                        <IoMdArrowDropdown style={{ color: 'red', fontWeight: 600, fontSize: '15px' }} />
                                    )}
                                </td>
                                <td style={{ color: 'black', fontWeight: "bold" }}>{users.ip}</td>
                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.cdate}</td>
                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.last_communication}</td>
                                <td>
                                    {users.hdd_status === 'working' ? (
                                        <IoMdArrowDropup style={{ color: 'green', fontWeight: 600, fontSize: '15px' }} />
                                    ) : (
                                        <IoMdArrowDropdown style={{ color: 'red', fontWeight: 600, fontSize: '15px' }} />
                                    )}
                                </td>
                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.days_difference}</td>
                                <td>
                                    {['cam1', 'cam2', 'cam3', 'cam4'].map((camera, i) => (
                                        <span
                                            key={i}
                                            className="camera-status"
                                            style={{
                                                backgroundColor: users[camera] === 'working' ? 'green' : 'red',
                                            }}
                                        >
                                            {i + 1}
                                        </span>
                                    ))}
                                </td>
                                <td style={{ color: 'green', fontWeight: 600, fontSize: '15px' }}><IoMdArrowDropup /></td>
                                <td style={{ color: 'green', fontWeight: 600, fontSize: '15px' }}><IoMdArrowDropup /></td>
                                <td style={{ color: 'green', fontWeight: 600, fontSize: '15px' }}><IoMdArrowDropup /></td>
                                <td style={{ color: 'green', fontWeight: 600, fontSize: '15px' }}><IoMdArrowDropup /></td>
                                <td style={{ color: 'darkblue', fontWeight: 'bold', fontSize: '15px' }}><MdOutlineRefresh /></td>
                                <td style={{ color: 'black', paddingLeft: '0', fontWeight: 'bold' }}>{users.SiteAddress}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {renderPagination()}
            </div>
        </div>

    );
};

export default HddError;
