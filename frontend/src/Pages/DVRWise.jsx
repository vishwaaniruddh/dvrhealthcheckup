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

const DVRWise = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [exportdata, setExportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://192.168.100.220:2001/newallsites_api_dvrwise"
      );
      setData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <Header />
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="header-sec">
            <span className="first" style={{ color: "darkslateblue" }}>
              All View
            </span>
          </div>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>DVR Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{item.dvrname}</td>
                  <td>{item["count(1)"]}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DVRWise;
