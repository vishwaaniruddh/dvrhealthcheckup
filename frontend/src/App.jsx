import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import AllSitesDetails from './Pages/AllSitesDetails';
import NewAllSitesDetails_test from './Pages/NewAllSitesDetails_test';
import OnlineSites from './Pages/OnlineSites';
import OfflineSites from './Pages/OfflineSites';
import DVROfflineSites from './Pages/DVROfflineSites';
import NetOnlineSites from './Pages/NetOnlineSites';
import NetOfflineSites from './Pages/NetOfflineSites';
import HddNotWorkingSites from './Pages/HddNotWorkingSites';
import HddNoDisk from './Pages/HddNoDisk';
import HddNotExist from './Pages/HddNotExist';
import HddAbnormal from './Pages/HddAbnormal';
import HddUnformatted from './Pages/HddUnformatted';
import HddError from './Pages/HddError';
import HddOne from './Pages/HddOne';
import NeverOnSites from './Pages/NeverOnSites';
import Hdd from './Pages/Hdd';
import DistributedHddData from './Pages/DistributedHddData';
import NotExist from './Pages/NotExist';
import NoDisk from './Pages/NoDisk';
import NoDiscIdle from './Pages/NoDiscIdle';
import Unformatted from './Pages/Unformatted';
import Abnormal from './Pages/Abnormal';
import Null from './Pages/Null';
import HttpPortNotWorkingDetails from './Pages/HttpPortNotWorkingDetails';
import SdkPortNotWorkingDetails from './Pages/SdkPortNotWorkingDetails';
import RouterPortNotWorkingDetails from './Pages/RouterPortNotWorkingDetails';
import AiPortNotWorkingDetails from './Pages/AiPortNotWorkingDetails';
import RtspPortNotWorkingDetails from './Pages/RtspPortNotWorkingDetails';
import RecNotAvailable from './Pages/RecNotAvailable';
import DeviceHistory from './Pages/DeviceHistory';
import NewAllSitesDetails from './Pages/NewAllSitesDetails';
import DVRWise from './Pages/DVRWise';



const App = () => {
  return (
    <BrowserRouter>

      <Routes>
        <Route path='/Login' element={<Login />} />
        <Route path='/Register' element={<Register />} />
        <Route path='/Dashboard' element={<Dashboard />} />
        <Route path='/AllSitesDetails' element={<AllSitesDetails />} />
        <Route path='/NewAllSitesDetails' element={<NewAllSitesDetails />} />
        <Route path='/NewAllSitesDetails_test' element={<NewAllSitesDetails_test />} />
        <Route path='/OnlineSites' element={<OnlineSites />} />
        <Route path='/OfflineSites' element={<OfflineSites />} />
        <Route path='/DVROfflineSites' element={<DVROfflineSites />} />
        <Route path='/NetOnlineSites' element={<NetOnlineSites />} />
        <Route path='/NetOfflineSites' element={<NetOfflineSites />} />
        <Route path='/HddNotWorkingSites' element={<HddNotWorkingSites />} />
        <Route path='/HddNoDisk' element={<HddNoDisk />} />
        <Route path='/HddNotExist' element={<HddNotExist />} />
        <Route path='/HddAbnormal' element={<HddAbnormal />} />
        <Route path='/HddUnformatted' element={<HddUnformatted />} />
        <Route path='/HddError' element={<HddError />} />
        <Route path='/HddOne' element={<HddOne />} />
        <Route path='/NeverOnSites' element={<NeverOnSites />} />
        <Route path='/Hdd' element={<Hdd />} />
        <Route path='/DistributedHddData' element={<DistributedHddData />} />
        <Route path="NotExist" element={<NotExist />} />
        <Route path="NoDisk" element={<NoDisk />} />
        <Route path="NoDiscIdle" element={<NoDiscIdle />} />
        <Route path="Unformatted" element={<Unformatted />} />
        <Route path="Abnormal" element={<Abnormal />} />
        <Route path="Error" element={<Error />} />
        <Route path="Null" element={<Null />} />
        <Route path="HttpPortNotWorkingDetails" element={<HttpPortNotWorkingDetails />} />
        <Route path="SdkPortNotWorkingDetails" element={<SdkPortNotWorkingDetails />} />
        <Route path="RouterpPortNotWorkingDetails" element={<RouterPortNotWorkingDetails />} />
        <Route path="AipPortNotWorkingDetails" element={<AiPortNotWorkingDetails />} />
        <Route path="RtspPortNotWorkingDetails" element={<RtspPortNotWorkingDetails />} />
        <Route path="RecNotAvailable" element={<RecNotAvailable />} />
        <Route path="DeviceHistory/:atmId" element={<DeviceHistory />} />
        <Route path="DVRWise" element={<DVRWise />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App