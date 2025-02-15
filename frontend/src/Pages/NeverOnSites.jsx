import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap';
import axios from 'axios';
import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';
import { MdOutlineRefresh } from "react-icons/md";
import * as XLSX from 'xlsx';

const NeverOnSites = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [atmid, setAtmid] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [neverOn, setNeverOn] = useState(0);
    const [exportedData,  setExportedData] = useState([]);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchData();
    }, [currentPage, atmid]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://127.0.0.1:2001/neveronsites_api", {
                params: { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, atmid },
            });

            setData(response.data.data);
            console.log(response.data.data)
            setTotalRecords(response.data.totalCount);
            // setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {

        fetch("http://127.0.0.1:2001/neveron")
          .then(response => response.json())
          .then(data => setNeverOn(data.neveron))
          .catch(error => console.error('Error fetching number of online sites:', error));
      }, []);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:2001/ExportNeverOnSites`);
                setExportedData(response.data.data);
                console.log('export',response.data.data)
                setLoading(false)
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
        XLSX.writeFile(wb, 'Never_On_Sites.xlsx');
    };

    return loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="container-fluid">
            <div className='header-sec'>
                <span className='first'>Never On Sites</span>
                <span className='second'>Total Devices : <span style={{color:"red"}}> {neverOn}</span> </span>
                <button onClick={exportToExcel} className='btn btn-primary'>Download excel</button>
                <div className="input-box">
                    <i className="uil uil-search"></i>
                    <input type="text" placeholder="Search here..." value={atmid}
                        onChange={(e) => setAtmid(e.target.value)} />
                    <button className="button" onClick={handleSearch}>Search</button>
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
                            <th>Ip</th>   
                            <th>Branch Address</th>                       
                            <th></th>
                         

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
                                <td style={{ fontWeight: "bold" }}>{users.CITY}</td>
                                <td style={{ fontWeight: "bold" }}> {users.STATE}</td>
                                <td style={{ fontWeight: "bold" }}>{users.ZONE}</td>
                                <td style={{ color: 'black', fontWeight: "bold" }}>{users.ip}</td>
                                <td style={{ color: 'black', paddingLeft: '0', fontWeight: 'bold' }}>{users.SiteAddress}</td>
                                <td style={{ color: 'darkblue', fontWeight: 'bold', fontSize: '15px' }}><MdOutlineRefresh /></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {renderPagination()}
            </div>
        </div>

    );
};

export default NeverOnSites;
