import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import React from 'react';
import NotExist from './NotExist';
import Abnormal from './Abnormal';
import Unformatted from './Unformatted';
import NoDiscIdle from './NoDiscIdle';
import Error from './Error';
import NoDisk from './NoDisk';
import Hdd from './Hdd';
import Null from './Null';

function DistributedData() {

    return (
        <div>
            <Hdd />
            <div className='mt-4'>
                <Tabs
                    defaultActiveKey="profile"
                    id="justify-tab-example"
                    className="mb-3"
                    justify
                >
                    <Tab eventKey="home" title="Error">
                        <Error />
                    </Tab>
                    <Tab eventKey="profile" title="Not Exist">
                        <NotExist />
                    </Tab>
                    <Tab eventKey="unformatted" title="Unformatted">
                        <Unformatted />
                    </Tab>
                    <Tab eventKey="abnormal" title="Abnormal">
                        <Abnormal />
                    </Tab>
                    <Tab eventKey="nodisc" title="No Disk/idle">
                        <NoDiscIdle />
                    </Tab>
                    <Tab eventKey="No Disk" title="No Disk">
                        <NoDisk />
                    </Tab>
                    <Tab eventKey="Null" title="Null">
                        <Null />
                    </Tab>

                </Tabs>
            </div>

        </div>

    );
}

export default DistributedData;