<?php session_start();
if(isset($_SESSION['login_user']) && isset($_SESSION['id']))
{
include 'config.php';

echo "Sync Started";
$result=mysqli_query($conn,"select Status,Phase,Customer,Bank,ATMID,ATMID_2,ATMID_3,ATMID_4,TrackerNo,ATMShortName,SiteAddress,City,State,Zone,Panel_Make,OldPanelID,NewPanelID,DVRIP,DVRName,UserName,Password,live,current_dt,mailreceive_dt,eng_name,addedby,site_remark,DVR_Model_num,Router_Model_num,PanelIP,CTS_LocalBranch,RouterIp,SN from sites where modify=1");
$result1=mysqli_query($conn,"select Status,Phase,Customer,Bank,ATMID,ATMID_2,ATMID_3,ATMID_4,TrackerNo,ATMShortName,SiteAddress,City,State,Zone,UserName,Password,live,current_dt,mailreceive_dt,addedby,site_remark,DVR_Model_num,DVR_Serial_num,HDD,Camera1,Camera2,Camera3,Attachment1,Attachment2,CTSLocalBranch,CTS_BM_Name,CTS_BM_Number,install_Status,SN from dvrsite where modify=1");
$result2=mysqli_query($conn,"select ATMID,Address,Location,State,IPAddress,`Rourt ID`,`Live Date`,UserName,Password,Status,dvrname,customer from dvronline where modify=1");
$result3=mysqli_query($conn,"select SN,Customer,Bank,ATM_ID,ATM_ID2,ATM_ID3,ATM_ID4,ATMShortName,SiteAddress,City,State,DVRIP,Network,DVRPort,UserName,Password,CSSBM,CSSBMNumber,EMail_ID,BackofficerName,BackofficerNumber,HeadSupervisorName,HeadSupervisorNumber,SupervisorName,Supervisornumber,Policestation,Polstnname,atm_officer_name,atm_officer_number,RA_QRT_NAME,RA_QRT_NUMBER from esurvsites where modify=1");
echo "Sync in progress";
while($row=mysqli_fetch_row($result)){
	$qry="insert into sites(Status,Phase,Customer,Bank,ATMID,ATMID_2,ATMID_3,ATMID_4,TrackerNo,ATMShortName,SiteAddress,City,State,Zone,Panel_Make,OldPanelID,NewPanelID,DVRIP,DVRName,UserName,Password,live,current_dt,mailreceive_dt,eng_name,addedby,site_remark,DVR_Model_num,Router_Model_num,PanelIP,CTS_LocalBranch,RouterIp,SN)
values('$row[0]','$row[1]','$row[2]','$row[3]','$row[4]','$row[5]','$row[6]','$row[7]','$row[8]','$row[9]','$row[10]','$row[11]','$row[12]','$row[13]','$row[14]','$row[15]','$row[16]','$row[17]','$row[18]','$row[19]','$row[20]','$row[21]','$row[22]','$row[23]','$row[24]','$row[25]','$row[26]','$row[27]','$row[28]','$row[29]','$row[30]','$row[31]','$row[32]')";
	$res=mysqli_query($cn,$qry);
	
	$sql_dvrhealth="insert into `dvr_health`(ip,atmid,dvrtype,live) values('$row[17]','$row[4]','$row[18]','P')";
	mysqli_query($cn,$sql_dvrhealth);
	
	$sql_panelhealth="insert into `panel_health`(ip,atmid,panelName,panelid) values('$row[29]','$row[4]','$row[14]','$row[16]')";
	mysqli_query($cn,$sql_panelhealth);
	
 if($res)
	 mysqli_query($conn,"update sites set modify=0 where ATMID='$row[4]'");
}
echo "Sites table Updated , others in progress";
while($row=mysqli_fetch_row($result1)){
	$qry1="insert into dvrsite(Status,Phase,Customer,Bank,ATMID,ATMID_2,ATMID_3,ATMID_4,TrackerNo,ATMShortName,SiteAddress,City,State,Zone,UserName,Password,live,current_dt,mailreceive_dt,addedby,site_remark,DVR_Model_num,DVR_Serial_num,HDD,Camera1,Camera2,Camera3,Attachment1,Attachment2,CTSLocalBranch,CTS_BM_Name,CTS_BM_Number,install_Status,SN)
values('$row[0]','$row[1]','$row[2]','$row[3]','$row[4]','$row[5]','$row[6]','$row[7]','$row[8]','$row[9]','$row[10]','$row[11]','$row[12]','$row[13]','$row[14]','$row[15]','$row[16]','$row[17]','$row[18]','$row[19]','$row[20]','$row[21]','$row[22]','$row[23]','$row[24]','$row[25]','$row[26]','$row[27]','$row[28]','$row[29]','$row[30]','$row[31]','$row[32]','$row[33]')";
	$res1=mysqli_query($cn,$qry1);
 if($res1)
	 mysqli_query($conn,"update dvrsite set modify=0 where ATMID='$row[4]'");
}
echo "Dvrsite table Updated , others in progress";
while($row=mysqli_fetch_row($result2)){
	$qry2="insert into dvronline(ATMID,Address,Location,State,IPAddress,`Rourt ID`,`Live Date`,UserName,Password,Status,dvrname,customer)values('$row[0]','$row[1]','$row[2]','$row[3]','$row[4]','$row[5]','$row[6]','$row[7]','$row[8]','$row[9]','$row[10]','$row[11]')";
	$res2=mysqli_query($cn,$qry2);
 if($res2)
	 mysqli_query($conn,"update dvronline set modify=0 where ATMID='$row[0]'");
}
echo "dvronline table Updated , others in progress";
while($row=mysqli_fetch_row($result3)){
	$qry3="insert into esurvsites(SN,Customer,Bank,ATM_ID,ATM_ID2,ATM_ID3,ATM_ID4,ATMShortName,SiteAddress,City,State,DVRIP,Network,DVRPort,UserName,Password,CSSBM,CSSBMNumber,EMail_ID,BackofficerName,BackofficerNumber,HeadSupervisorName,HeadSupervisorNumber,SupervisorName,Supervisornumber,Policestation,Polstnname,atm_officer_name,atm_officer_number,RA_QRT_NAME,RA_QRT_NUMBER)
values('$row[0]','$row[1]','$row[2]','$row[3]','$row[4]','$row[5]','$row[6]','$row[7]','$row[8]','$row[9]','$row[10]','$row[11]','$row[12]','$row[13]','$row[14]','$row[15]','$row[16]','$row[17]','$row[18]','$row[19]','$row[20]','$row[21]','$row[22]','$row[23]','$row[24]','$row[25]','$row[26]','$row[27]','$row[28]','$row[29]','$row[30]')";
	$res3=mysqli_query($cn,$qry3);
 if($res3)
	 mysqli_query($conn,"update esurvsites set modify=0 where ATM_ID='$row[3]'");
}
echo "Insert Complete, update in progress";

$resultup=mysqli_query($conn,"select SN,Status,Phase,Customer,Bank,ATMID,ATMID_2,ATMID_3,ATMID_4,TrackerNo,ATMShortName,SiteAddress,City,State,Zone,Panel_Make,OldPanelID,NewPanelID,DVRIP,DVRName,UserName,Password,live,current_dt,mailreceive_dt,eng_name,editby,site_remark,DVR_Model_num,Router_Model_num,PanelIP,CTS_LocalBranch,RouterIp from sites where modify=2");
$resultup1=mysqli_query($conn,"select SN,Status,Phase,Customer,Bank,ATMID,ATMID_2,ATMID_3,ATMID_4,TrackerNo,ATMShortName,SiteAddress,City,State,Zone,UserName,Password,live,current_dt,mailreceive_dt,editby,site_remark,DVR_Model_num,DVR_Serial_num,HDD,Camera1,Camera2,Camera3,Attachment1,Attachment2,CTSLocalBranch,CTS_BM_Name,CTS_BM_Number,install_Status from dvrsite where modify=2");
$resultup2=mysqli_query($conn,"select ATMID,Address,Location,State,IPAddress,`Rourt ID`,`Live Date`,UserName,Password,Status,dvrname,customer from dvronline where modify=2");
$resultup3=mysqli_query($conn,"select SN,Customer,Bank,ATM_ID,ATM_ID2,ATM_ID3,ATM_ID4,ATMShortName,SiteAddress,City,State,DVRIP,Network,DVRPort,UserName,Password,CSSBM,CSSBMNumber,EMail_ID,BackofficerName,BackofficerNumber,HeadSupervisorName,HeadSupervisorNumber,SupervisorName,Supervisornumber,Policestation,Polstnname,atm_officer_name,atm_officer_number,RA_QRT_NAME,RA_QRT_NUMBER from esurvsites where modify=2");

while($row=mysqli_fetch_row($resultup)){
	$qry="update sites set Status='".$row['Status']."',Phase='".$row['Phase']."',Customer='".$row['Customer']."',Bank='".$row['Bank']."',ATMID='".$row['ATMID']."',ATMID_2='".$row['ATMID_2']."',ATMID_3='".$row['ATMID_3']."',ATMID_4='".$row['ATMID_4']."',
TrackerNo='".$row['TrackerNo']."',City='".$row['City']."',State='".$row['State']."',Zone='".$row['Zone']."',Panel_Make='".$row['Panel_Make']."',OldPanelID='".$row['OldPanelID']."' ,
NewPanelID='".$row['NewPanelID']."',DVRIP='".$row['DVRIP']."',DVRName='".$row['DVRName']."',UserName='".$row['UserName']."',Password='".$row['Password']."',live='".$row['live']."',eng_name='".$row['eng_name']."',editby='".$row['editby']."',site_remark='".$row['site_remark']."',PanelIP='".$row['PanelIP']."',DVR_Model_num='".$row['DVR_Model_num']."',Router_Model_num='".$row['Router_Model_num']."',CTS_LocalBranch='".$row['CTS_LocalBranch']."',RouterIp='".$row['RouterIp']."'  where SN='".$row['SN']."'";
	$res=mysqli_query($cn,$qry);
	
	$qDVR_health="update dvr_health set ip='".$DVRIP."' , dvrtype='".$DVRName."',live='".$live."',atmid='".$ATMID."' where atmid='".$ATMID."' ";
    mysqli_query($cn,$qDVR_health);

    $qryPanel_health="update panel_health set ip='".$PanelsIP."' , panelName='".$Panel_Make."',panelid='".$NewPanelID."',atmid='".$ATMID."' where atmid='".$ATMID."' ";
    mysqli_query($cn,$qryPanel_health);

 if($res)
	mysqli_query($conn,"update sites set modify=0 where ATMID='".$row['ATMID']."'");
}
echo "Sites table Updated , others in progress";
while($row=mysqli_fetch_row($resultup1)){
	$qry1="update dvrsite set Status='".$row['Status']."',Phase='".$row['Phase']."',Customer='".$row['Customer']."',Bank='".$row['Bank']."',ATMID='".$row['ATMID']."',ATMID_2='".$row['ATMID_2']."',ATMID_3='".$row['ATMID_3']."',ATMID_4='".$row['ATMID_4']."',
          TrackerNo='".$row['TrackerNo']."',ATMShortName='".$row['ATMShortName']."',SiteAddress='".$row['SiteAddress']."',City='".$row['City']."',State='".$row['State']."',Zone='".$row['Zone']."',CTSLocalBranch='".$row['CTSLocalBranch']."',CTS_BM_Name='".$row['CTS_BM_Name']."',CTS_BM_Number='".$row['CTS_BM_Number']."',install_Status='".$row['install_Status']."',UserName='".$row['UserName']."',Password='".$row['Password']."'  
		  , DVRIP='".$row['DVRIP']."',DVRName='".$row['DVRName']."',DVR_Model_num='".$row['DVR_Model_num']."', DVR_Serial_num='".$row['DVR_Serial_num']."',HDD ='".$row['HDD']."',Camera1 ='".$row['Camera1']."'
		   , Camera2 ='".$row['Camera2']."',Camera3 ='".$row['Camera3']."',site_remark  ='".$row['site_remark']."',liveDate ='".$row['liveDate']."', editby='".$row['editby']."',live='".$row['live']."' where SN='".$row['SN']."'";
	$res1=mysqli_query($cn,$qry1);

 if($res1)
	 mysqli_query($conn,"update dvrsite set modify=0 where ATMID='".$row['ATMID']."'");
}
echo "Dvrsite table Updated , others in progress";
while($row=mysqli_fetch_row($resultup2)){
	$qry2="update dvronline set ATMID='$row[0]',Address='$row[1]',Location='$row[2]',State='$row[3]',IPAddress='$row[4]',`Rourt ID`='$row[5]',`Live Date`='$row[6]',UserName='$row[7]',Password='$row[8]',Status='$row[9]',dvrname='$row[10]',customer='$row[11]' where ATMID='$row[0]')";
	$res2=mysqli_query($cn,$qry2);
 if($res2)
	 mysqli_query($conn,"update dvronline set modify=0 where ATMID='$row[0]'");
}
echo "dvronline table Updated , others in progress";
while($row=mysqli_fetch_row($resultup3)){
	$qry3="update esurvsites set Network='".$row['Network']."',DVRPort='".$row['DVRPort']."',EMail_ID='".$row['EMail_ID']."',BackofficerName='".$row['BackofficerName']."',BackofficerNumber='".$row['BackofficerNumber']."',
	CSSBM='".$row['CSSBM']."',CSSBMNumber='".$row['CSSBMNumber']."',HeadSupervisorName='".$row['HeadSupervisorName']."',
	HeadSupervisorNumber='".$row['HeadSupervisorNumber']."',SupervisorName='".$row['SupervisorName']."',Supervisornumber='".$row['Supervisornumber']."',Policestation='".$row['Policestation']."',Polstnname='".$row['Polstnname']."',
	atm_officer_name='".$row['atm_officer_name']."',atm_officer_number='".$row['atm_officer_number']."',RA_QRT_NAME='".$row['RA_QRT_NAME']."',RA_QRT_NUMBER='".$row['RA_QRT_NUMBER']."' where ATM_ID='".$row['ATM_ID']."'";
	$res3=mysqli_query($cn,$qry3);
 if($res3)
	 mysqli_query($conn,"update esurvsites set modify=0 where ATM_ID='".$row['ATM_ID']."'");
}

echo "Sync Complete";
$conn -> close();
$cn -> close();

}
else
	echo "Sorry you are logged out. Please login again to continue";
?>