import React, { useState, useEffect } from 'react';
import { Table } from 'react-bootstrap'
import ReactPaginate from "react-paginate";
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi'

const NoDisk = () => {
    const [post, setPost] = useState([]);
    const [number, setNumber] = useState(1);
    const [postPerPage] = useState(100);
    const [searchQuery, setSearchQuery] = useState('');
    const lastPost = number * postPerPage;
    const firstPost = lastPost - postPerPage;

    const exportToExcel = () => {
        const fileType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'NoDisk_Hdd';

        const ws = XLSX.utils.json_to_sheet(filteredPosts);
        const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
        });
        const data = new Blob([excelBuffer], { type: fileType });
        const href = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + fileExtension;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredPosts = post
        ? post.filter(post =>
            post.atmid && post.atmid.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    // const handleSearch = e => {
    //     setSearchQuery(e.target.value);
    // };


    const currentPost = filteredPosts.slice(firstPost, lastPost);
    const PageCount = Math.ceil(filteredPosts.length / postPerPage);
    const ChangePage = ({ selected }) => {
        setNumber(selected + 1);
    };

    useEffect(() => {
        axios.get(`http://192.168.100.220:2001/NoDiskSites`)
            .then(response => {
                if (response.data && response.data.length > 0) {
                    setPost(response.data);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }, []);
    return (
        <div>
            <div className="row">
                <div className="col-6 pt-3">
                    <h6>HDD Status Report for <span style={{ color: 'red', fontWeight: 'bold', fontSize: '15px' }}>( No Disk )</span></h6>

                </div>
                <div className="col-6 d-flex justify-content-end">
                    <div className='col-4 text-end login-form2'>
                        <button onClick={exportToExcel} className="btn btn-primary mt-3">
                            Export to Excel
                        </button>
                    </div>
                </div>
            </div>
            <Table striped bordered hover className='custom-table mt-4'>
                <thead>
                    <tr>
                        <th>Sr No</th>
                        <th>ATM ID</th>
                        <th>Up/Down</th>
                        <th>Router Ip</th>
                        <th>Last Communication</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Zone</th>
                        <th>Camera Status</th>
                        <th>Aging</th>
                    </tr>
                </thead>
                <tbody>
                    {post.length > 0 ? (
                        currentPost.map((users, index) => {
                            return (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td style={{ color: 'darkblue', fontWeight: 'bold', fontSize: '15px' }}>{users.atmid}</td>
                                    <td>
                                        {users.login_status === 'working' ? (
                                            <FiArrowUp style={{ color: 'green', fontSize: '20px' }} />
                                        ) : (
                                            <FiArrowDown style={{ color: 'red', fontSize: '20px' }} />
                                        )}
                                    </td>
                                    <td style={{ color: 'skyblue', fontWeight: 'bold', fontSize: '15px' }}>{users.ip}</td>
                                    <td style={{ color: 'maroon', fontWeight: 600, fontSize: '13px' }}>{users.last_communication}</td>
                                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{users.City}</td>
                                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{users.State}</td>
                                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{users.Zone}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div
                                                style={{
                                                    width: '15px',
                                                    height: '15px',
                                                    borderRadius: "20px",
                                                    backgroundColor: users.cam1 === 'working' ? 'green' : 'red',
                                                    marginRight: '5px',
                                                    paddingTop: "3px"
                                                }}
                                            ></div>
                                            <div
                                                style={{
                                                    width: '15px',
                                                    height: '15px',
                                                    borderRadius: "20px",
                                                    backgroundColor: users.cam2 === 'working' ? 'green' : 'red',
                                                    marginRight: '5px',
                                                }}
                                            ></div>
                                            <div
                                                style={{
                                                    width: '15px',
                                                    height: '15px',
                                                    borderRadius: "20px",
                                                    backgroundColor: users.cam3 === 'working' ? 'green' : 'red',
                                                    marginRight: '5px',
                                                }}
                                            ></div>
                                            <div
                                                style={{
                                                    width: '15px',
                                                    height: '15px',
                                                    borderRadius: "20px",
                                                    backgroundColor: users.cam4 === 'working' ? 'green' : 'red',
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'red', fontWeight: 'bold', fontSize: '15px' }}>{users.days_difference}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan='14'>Loading...</td>
                        </tr>
                    )}
                </tbody>
            </Table>
            <ReactPaginate
                previousLabel={"<"}
                nextLabel={">"}
                pageCount={PageCount}
                onPageChange={ChangePage}
                containerClassName={"paginationBttns"}
                activeClassName={"paginationActive"}
                disableInitialCallback={true}
                initialPage={0}
            ></ReactPaginate>
        </div>
    )
}

export default NoDisk