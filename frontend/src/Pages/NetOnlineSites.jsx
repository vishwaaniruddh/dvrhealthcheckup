import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';
import { MdOutlineRefresh } from "react-icons/md";
import { IoMdArrowDropup } from "react-icons/io";
import { IoMdArrowDropdown } from "react-icons/io";


const AllSitesDetails = () => {

    const [data, setData] = useState([]);
    const [atmid, setAtmid] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [exportedData,  setExportedData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [onlineSites, setOnlineSites] = useState(0);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, [currentPage, atmid]);

    const fetchData = async () => {
        try {
            const response = await axios.get("http://192.168.100.220:2001/netonlinesites_api", {
                params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, atmid },
            });

            setData(response.data.data);
            setTotalRecords(response.data.totalCount);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {

        fetch("http://192.168.100.220:2001/NetOnlineSites")
            .then(response => response.json())
            .then(data => setOnlineSites(data.net_online_count))
            .catch(error => console.error('Error fetching number of online sites:', error));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://192.168.100.220:2001/ExportNetOnlineSites`);
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
        XLSX.utils.book_append_sheet(wb, ws, 'Online Sites Data');
        XLSX.writeFile(wb, 'Net_Online_Sites.xlsx');
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
                <span className='first'>Online Sites</span>
                <span className='second'>Total Devices Up : {onlineSites} </span>

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
                            <th>last communication</th>
                            <th>Dev</th>
                            <th>Diff</th>
                            <th>hdd</th>
                            <th>Rec</th>
                            <th>Cam Status</th>
                            <th>http </th>
                            <th>rtsp </th>
                            <th>sdk </th>
                            <th>ai </th>
                            <th>rec from</th>
                            <th>rec to</th>
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
                                        to={`/DeviceHistory/${users.ip}`}
                                        style={{
                                            textDecoration: 'none',
                                            color: 'darkblue',
                                        }}
                                    >
                                        {users.atmid}
                                    </Link>
                                </td>
                                <td style={{ color: 'teal', fontWeight: "bold" }}>{users.Bank}</td>
                                <td style={{ fontWeight: "bold" }}>{users.City}</td>
                                <td style={{ fontWeight: "bold" }}> {users.State}</td>
                                <td style={{ fontWeight: "bold" }}>{users.Zone}</td>
                                <td>
                                    {users.login_status === 'working' ? (
                                        <IoMdArrowDropup style={{ color: 'green', fontWeight: 600, fontSize: '15px' }} />
                                    ) : (
                                        <IoMdArrowDropdown style={{ color: 'red', fontWeight: 600, fontSize: '15px' }} />
                                    )}
                                </td>
                                <td style={{ color: 'black', fontWeight: "bold" }}>{users.ip}</td>
                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.last_communication}</td>
                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.cdate}</td>
                                <td>diff</td>
                                <td>
                                    {users.hdd_status === 'working' ? (
                                        <IoMdArrowDropup style={{ color: 'green', fontWeight: 600, fontSize: '15px' }} />
                                    ) : (
                                        <IoMdArrowDropdown style={{ color: 'red', fontWeight: 600, fontSize: '15px' }} />
                                    )}
                                </td>
                                <td style={{ color: 'black', fontWeight: "bold" }}>R</td>
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

                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.recording_from}</td>
                                <td style={{ color: 'maroon', fontWeight: 'bold' }}>{users.recording_to}</td>
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

export default AllSitesDetails;
