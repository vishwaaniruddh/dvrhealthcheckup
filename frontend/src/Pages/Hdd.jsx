

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Hdd = () => {
    const [summaryData, setSummaryData] = useState([])
    useEffect(() => {
        axios.get(`http://192.168.100.220:2001/summaryData`)
            .then(response => {
                if (response.data && response.data.length > 0) {
                    setSummaryData(response.data);
                }
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    return (
        <div>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                {summaryData.map((item, index) => (
                    <div key={index} style={{
                        width: 'calc(16.666% - 20px)',
                        margin: '5px',
                        padding: '10px',
                        background: "#435334",
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        boxSizing: 'border-box',
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}>
                        {item.hdd}: {item.count_per_value}
                    </div>
                ))}
            </div>


        </div>


    )
}

export default Hdd