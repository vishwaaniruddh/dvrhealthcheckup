import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';


const RtspPortNotWorkingDetails = () => {

    const [data, setData] = useState([]);
    const [atmid, setAtmid] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, [currentPage, atmid]);

    const fetchData = async () => {
        try {
            const response = await axios.get("http://192.168.100.220:2001/rtsp_not_workingdetails_api", {
                params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, atmid },
            });

            setData(response.data.data);
            setTotalRecords(response.data.totalCount);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
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
                <span className='first' style={{ color: "darkslateblue" }}>All View</span>
                <span className='second'>Total Devices : Up <span style={{ color: "green" }}>4270</span>Down : <span style={{ color: "red" }}>657</span></span>
                <button className='btn btn-primary'>Download excel</button>
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
                            <th>Branch Address</th>

                        </tr>
                    </thead>
                    <tbody>
                        {data.map((users, index) => (
                            <tr key={users.atmid}>
                                <td>{index + 1}</td>
                                <td style={{ color: 'darkblue', fontWeight: 'bold' }}>
                                    <Link
                                        to={`/admin/DeviceHistory/${users.atmid}`}
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

export default RtspPortNotWorkingDetails;
