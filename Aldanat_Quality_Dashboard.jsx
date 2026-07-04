import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Cell, PieChart, Pie, ReferenceLine, Legend,
} from "recharts";

// ─── Embedded sample data (Jul 2025 – Jun 2026) ─────────────────────────────
const RAW = {"staff":[["S001","Amara Adeyemi","Care Assistant","Harwich","Active"],["S002","Ben Brown","Care Assistant","Clacton","Active"],["S003","Chloe Clarke","Care Assistant","Harwich","Active"],["S004","David Daramola","Care Assistant","Clacton","Active"],["S005","Esther Evans","Care Assistant","Colchester","Active"],["S006","Femi Fashola","Care Assistant","Harwich","Active"],["S007","Grace Green","Care Assistant","Harwich","Active"],["S008","Hassan Hughes","Care Assistant","Harwich","Active"],["S009","Ivy Ibrahim","Care Assistant","Colchester","Active"],["S010","James Jones","Care Assistant","Clacton","Active"],["S011","Kemi Kalu","Care Assistant","Colchester","Active"],["S012","Liam Lewis","Care Assistant","Harwich","Active"],["S013","Maria Mensah","Care Assistant","Clacton","Active"],["S014","Ngozi Nwosu","Care Assistant","Harwich","Active"],["S015","Oliver Okafor","Care Assistant","Clacton","Active"],["S016","Priya Patel","Care Assistant","Colchester","Active"],["S017","Rachel Roberts","Care Assistant","Clacton","Active"],["S018","Samuel Smith","Care Assistant","Colchester","Active"],["S019","Tola Taylor","Care Assistant","Harwich","Active"],["S020","Uche Umar","Care Assistant","Clacton","Active"],["S021","Victoria Walker","Senior Care Assistant","Harwich","Active"],["S022","Wale Osho","Senior Care Assistant","Colchester","Active"],["S023","Xin Young","Senior Care Assistant","Harwich","Active"],["S024","Yemi Bello","Senior Care Assistant","Harwich","Active"],["S025","Zainab Ahmed","Senior Care Assistant","Harwich","Active"],["S026","Kate Wilson","Team Leader","Colchester","Active"],["S027","Daniel Ojo","Team Leader","Clacton","Leaver"],["S028","Funke Adebayo","Team Leader","Colchester","Leaver"]],"incidents":[["INC0001","2025-07-04","S005","Missed visit","Low","Yes","No","Closed"],["INC0002","2025-07-06","S020","Safeguarding concern","Low","Yes","No","Open"],["INC0003","2025-07-14","S018","Fall","Low","Yes","No","Closed"],["INC0004","2025-07-16","S018","Medication error","Low","Yes","No","Closed"],["INC0005","2025-07-21","S001","Medication error","Low","Yes","No","Open"],["INC0006","2025-07-21","S012","Safeguarding concern","Moderate","Yes","No","Closed"],["INC0007","2025-07-25","S004","Near miss","Low","No","No","Closed"],["INC0008","2025-07-27","S012","Medication error","Low","Yes","No","Closed"],["INC0009","2025-07-28","S002","Fall","Moderate","Yes","No","Open"],["INC0010","2025-07-29","S008","Near miss","Moderate","Yes","No","Closed"],["INC0011","2025-08-04","S020","Safeguarding concern","Low","Yes","Yes","Closed"],["INC0012","2025-08-04","S025","Near miss","Low","No","No","Open"],["INC0013","2025-08-12","S021","Fall","Low","No","No","Closed"],["INC0014","2025-08-13","S026","Missed visit","High","Yes","No","Closed"],["INC0015","2025-08-13","S001","Medication error","Moderate","Yes","No","Open"],["INC0016","2025-08-16","S011","Medication error","Moderate","Yes","No","Open"],["INC0017","2025-08-17","S008","Near miss","Moderate","Yes","No","Open"],["INC0018","2025-08-18","S013","Fall","Low","Yes","No","Closed"],["INC0019","2025-08-21","S008","Safeguarding concern","Moderate","Yes","No","Closed"],["INC0020","2025-08-22","S004","Safeguarding concern","Moderate","Yes","Yes","Closed"],["INC0021","2025-08-23","S018","Medication error","Moderate","Yes","No","Closed"],["INC0022","2025-08-24","S012","Medication error","Moderate","Yes","No","Closed"],["INC0023","2025-08-26","S004","Safeguarding concern","Low","Yes","No","Closed"],["INC0024","2025-08-26","S026","Fall","Low","Yes","No","Closed"],["INC0025","2025-08-27","S013","Missed visit","High","Yes","Yes","Open"],["INC0026","2025-08-29","S020","Missed visit","High","Yes","No","Closed"],["INC0027","2025-08-30","S026","Safeguarding concern","Low","Yes","Yes","Open"],["INC0028","2025-09-02","S026","Safeguarding concern","Low","Yes","Yes","Closed"],["INC0029","2025-09-10","S022","Safeguarding concern","Low","No","No","Closed"],["INC0030","2025-09-12","S023","Near miss","Low","No","No","Open"],["INC0031","2025-09-15","S021","Fall","Moderate","Yes","No","Closed"],["INC0032","2025-09-18","S021","Near miss","Low","Yes","No","Closed"],["INC0033","2025-09-21","S004","Medication error","Moderate","Yes","No","Open"],["INC0034","2025-09-26","S020","Fall","Low","No","No","Closed"],["INC0035","2025-09-28","S004","Safeguarding concern","Low","Yes","No","Closed"],["INC0036","2025-09-28","S021","Injury to client","Moderate","No","No","Closed"],["INC0037","2025-10-02","S011","Fall","Moderate","Yes","No","Closed"],["INC0038","2025-10-07","S011","Property/equipment","High","Yes","Yes","Open"],["INC0039","2025-10-10","S016","Near miss","High","Yes","Yes","Closed"],["INC0040","2025-10-11","S026","Injury to client","Low","Yes","No","Closed"],["INC0041","2025-10-18","S023","Safeguarding concern","Low","Yes","Yes","Open"],["INC0042","2025-10-20","S020","Near miss","Low","Yes","No","Open"],["INC0043","2025-10-22","S025","Near miss","Moderate","No","No","Closed"],["INC0044","2025-10-23","S026","Medication error","Low","Yes","No","Closed"],["INC0045","2025-10-23","S025","Missed visit","Low","Yes","No","Closed"],["INC0046","2025-10-24","S004","Injury to client","Low","Yes","No","Closed"],["INC0047","2025-10-24","S027","Missed visit","Low","Yes","No","Closed"],["INC0048","2025-10-30","S021","Medication error","Low","No","No","Open"],["INC0049","2025-10-30","S004","Fall","Moderate","Yes","No","Closed"],["INC0050","2025-11-03","S020","Property/equipment","High","Yes","Yes","Closed"],["INC0051","2025-11-06","S017","Fall","Low","Yes","No","Closed"],["INC0052","2025-11-09","S007","Near miss","Moderate","Yes","No","Closed"],["INC0053","2025-11-11","S024","Near miss","Low","No","No","Closed"],["INC0054","2025-11-13","S022","Fall","Low","Yes","No","Open"],["INC0055","2025-11-18","S020","Safeguarding concern","Low","Yes","Yes","Closed"],["INC0056","2025-11-19","S020","Fall","Low","Yes","No","Closed"],["INC0057","2025-11-24","S021","Fall","Low","Yes","No","Closed"],["INC0058","2025-11-25","S010","Fall","Low","No","No","Closed"],["INC0059","2025-11-27","S020","Missed visit","Moderate","Yes","No","Closed"],["INC0060","2025-11-28","S025","Injury to client","Low","No","No","Closed"],["INC0061","2025-11-29","S004","Safeguarding concern","Moderate","No","Yes","Closed"],["INC0062","2025-11-30","S023","Near miss","Low","No","No","Open"],["INC0063","2025-11-30","S021","Fall","Moderate","Yes","No","Open"],["INC0064","2025-12-02","S021","Property/equipment","Low","Yes","No","Closed"],["INC0065","2025-12-04","S016","Medication error","Low","Yes","No","Closed"],["INC0066","2025-12-05","S020","Medication error","Low","Yes","No","Closed"],["INC0067","2025-12-07","S004","Near miss","High","Yes","Yes","Closed"],["INC0068","2025-12-09","S007","Injury to client","Low","No","No","Closed"],["INC0069","2025-12-11","S021","Missed visit","High","Yes","No","Closed"],["INC0070","2025-12-12","S026","Medication error","Moderate","No","No","Open"],["INC0071","2025-12-16","S006","Medication error","Moderate","Yes","No","Closed"],["INC0072","2025-12-18","S001","Injury to client","Low","Yes","No","Open"],["INC0073","2025-12-21","S021","Missed visit","Low","Yes","No","Closed"],["INC0074","2025-12-21","S007","Fall","Low","Yes","No","Closed"],["INC0075","2025-12-22","S026","Medication error","Low","Yes","No","Closed"],["INC0076","2025-12-25","S028","Near miss","Low","Yes","No","Closed"],["INC0077","2025-12-28","S004","Injury to client","Low","Yes","No","Open"],["INC0078","2025-12-31","S018","Fall","Low","Yes","No","Closed"],["INC0079","2025-12-31","S006","Injury to client","Moderate","Yes","No","Closed"],["INC0080","2025-12-31","S026","Missed visit","High","Yes","Yes","Closed"],["INC0081","2026-01-02","S011","Safeguarding concern","High","Yes","No","Closed"],["INC0082","2026-01-02","S019","Fall","Moderate","Yes","No","Open"],["INC0083","2026-01-04","S009","Property/equipment","Moderate","No","No","Open"],["INC0084","2026-01-06","S013","Missed visit","Moderate","Yes","No","Closed"],["INC0085","2026-01-06","S004","Missed visit","Moderate","Yes","No","Closed"],["INC0086","2026-01-08","S020","Property/equipment","Moderate","Yes","No","Closed"],["INC0087","2026-01-09","S022","Missed visit","Low","Yes","No","Closed"],["INC0088","2026-01-10","S010","Near miss","Low","Yes","No","Closed"],["INC0089","2026-01-16","S022","Near miss","Low","Yes","No","Closed"],["INC0090","2026-01-17","S012","Injury to client","Low","Yes","No","Open"],["INC0091","2026-01-19","S012","Near miss","Moderate","Yes","No","Closed"],["INC0092","2026-01-20","S026","Near miss","Moderate","Yes","No","Closed"],["INC0093","2026-01-23","S023","Medication error","Moderate","Yes","No","Closed"],["INC0094","2026-01-23","S018","Near miss","Low","Yes","No","Closed"],["INC0095","2026-01-25","S004","Missed visit","Low","Yes","No","Open"],["INC0096","2026-01-31","S013","Property/equipment","Low","No","No","Closed"],["INC0097","2026-01-31","S026","Fall","Low","Yes","No","Closed"],["INC0098","2026-02-01","S012","Medication error","Moderate","No","No","Closed"],["INC0099","2026-02-05","S001","Safeguarding concern","Moderate","Yes","Yes","Closed"],["INC0100","2026-02-05","S004","Missed visit","Low","No","No","Closed"],["INC0101","2026-02-09","S007","Missed visit","Low","Yes","No","Closed"],["INC0102","2026-02-10","S024","Injury to client","Low","No","No","Closed"],["INC0103","2026-02-11","S026","Missed visit","Moderate","Yes","No","Closed"],["INC0104","2026-02-14","S026","Missed visit","Moderate","Yes","No","Closed"],["INC0105","2026-02-17","S006","Injury to client","Low","Yes","No","Closed"],["INC0106","2026-02-19","S004","Medication error","Moderate","No","No","Closed"],["INC0107","2026-02-22","S024","Near miss","High","Yes","Yes","Closed"],["INC0108","2026-02-22","S020","Medication error","Moderate","No","No","Open"],["INC0109","2026-02-23","S026","Medication error","Moderate","Yes","No","Closed"],["INC0110","2026-02-24","S019","Near miss","Low","Yes","No","Open"],["INC0111","2026-03-01","S001","Medication error","Low","Yes","No","Closed"],["INC0112","2026-03-04","S007","Near miss","Low","No","No","Closed"],["INC0113","2026-03-08","S006","Fall","Moderate","Yes","No","Closed"],["INC0114","2026-03-10","S011","Medication error","Moderate","No","No","Closed"],["INC0115","2026-03-14","S016","Fall","Low","Yes","No","Closed"],["INC0116","2026-03-15","S001","Safeguarding concern","Low","Yes","Yes","Open"],["INC0117","2026-03-15","S015","Missed visit","High","Yes","Yes","Open"],["INC0118","2026-03-16","S005","Near miss","Moderate","Yes","No","Closed"],["INC0119","2026-03-17","S001","Fall","Low","Yes","No","Open"],["INC0120","2026-03-24","S007","Medication error","Moderate","Yes","No","Closed"],["INC0121","2026-03-25","S022","Property/equipment","Low","No","No","Closed"],["INC0122","2026-03-26","S004","Near miss","Moderate","Yes","No","Open"],["INC0123","2026-03-29","S028","Medication error","High","Yes","Yes","Closed"],["INC0124","2026-04-01","S022","Medication error","Low","Yes","No","Closed"],["INC0125","2026-04-03","S028","Missed visit","Low","Yes","No","Open"],["INC0126","2026-04-08","S022","Near miss","Moderate","Yes","No","Open"],["INC0127","2026-04-08","S001","Near miss","Moderate","No","No","Open"],["INC0128","2026-04-13","S020","Fall","Low","Yes","No","Closed"],["INC0129","2026-04-14","S004","Near miss","Low","Yes","No","Closed"],["INC0130","2026-04-18","S028","Fall","Low","Yes","No","Closed"],["INC0131","2026-04-19","S018","Fall","Moderate","Yes","No","Closed"],["INC0132","2026-04-22","S004","Fall","Low","Yes","No","Open"],["INC0133","2026-04-26","S012","Injury to client","Moderate","Yes","No","Closed"],["INC0134","2026-04-28","S026","Fall","Moderate","Yes","No","Closed"],["INC0135","2026-05-02","S004","Fall","High","Yes","Yes","Open"],["INC0136","2026-05-02","S025","Injury to client","Moderate","Yes","No","Closed"],["INC0137","2026-05-03","S004","Safeguarding concern","Low","Yes","Yes","Closed"],["INC0138","2026-05-03","S020","Fall","Low","Yes","No","Open"],["INC0139","2026-05-04","S008","Near miss","Low","Yes","No","Closed"],["INC0140","2026-05-07","S017","Injury to client","Low","No","No","Closed"],["INC0141","2026-05-09","S006","Fall","Moderate","Yes","No","Closed"],["INC0142","2026-05-14","S024","Near miss","Low","Yes","No","Closed"],["INC0143","2026-05-20","S012","Fall","Low","Yes","No","Closed"],["INC0144","2026-05-26","S020","Fall","Low","Yes","No","Closed"],["INC0145","2026-05-30","S011","Fall","Moderate","Yes","No","Open"],["INC0146","2026-06-01","S024","Medication error","Moderate","Yes","No","Closed"],["INC0147","2026-06-01","S004","Safeguarding concern","Low","Yes","Yes","Open"],["INC0148","2026-06-02","S021","Medication error","Moderate","Yes","No","Closed"],["INC0149","2026-06-03","S025","Medication error","Low","Yes","No","Open"],["INC0150","2026-06-09","S004","Missed visit","Low","Yes","No","Closed"],["INC0151","2026-06-11","S010","Injury to client","Low","Yes","No","Open"],["INC0152","2026-06-12","S004","Safeguarding concern","Low","Yes","Yes","Closed"],["INC0153","2026-06-15","S028","Near miss","Moderate","Yes","No","Open"],["INC0154","2026-06-15","S025","Property/equipment","Low","Yes","No","Open"],["INC0155","2026-06-17","S011","Property/equipment","Moderate","Yes","No","Open"],["INC0156","2026-06-20","S021","Missed visit","Low","Yes","No","Open"],["INC0157","2026-06-21","S026","Medication error","Low","Yes","No","Open"],["INC0158","2026-06-27","S005","Missed visit","Low","Yes","No","Open"],["INC0159","2026-06-27","S004","Fall","Moderate","Yes","No","Open"],["INC0160","2026-06-29","S024","Fall","Low","Yes","No","Open"]],"complaints":[["CMP0001","2025-07-17","S003","Family member","Communication","Low","Not upheld",24],["CMP0002","2025-08-06","S026","Family member","Communication","Low","Not upheld",17],["CMP0003","2025-08-10","S022","Healthcare professional","Conduct/attitude","Moderate","Upheld",14],["CMP0004","2025-08-11","S009","Client","Conduct/attitude","Low","Upheld",6],["CMP0005","2025-08-16","S026","Family member","Communication","Low","Partially upheld",39],["CMP0006","2025-08-17","S004","Client","Communication","Moderate","Not upheld",3],["CMP0007","2025-08-23","S026","Client","Conduct/attitude","Moderate","Partially upheld",11],["CMP0008","2025-08-26","S026","Family member","Punctuality","Low","Upheld",17],["CMP0009","2025-08-31","S012","Family member","Care quality","Low","Partially upheld",20],["CMP0010","2025-09-02","S025","Family member","Missed visit","Low","Pending",null],["CMP0011","2025-09-08","S004","Healthcare professional","Communication","High","Upheld",37],["CMP0012","2025-09-11","S020","Family member","Continuity of carer","Moderate","Partially upheld",30],["CMP0013","2025-09-11","S012","Family member","Communication","Low","Upheld",23],["CMP0014","2025-09-17","S012","Client","Communication","Low","Upheld",31],["CMP0015","2025-09-20","S004","Client","Care quality","Low","Upheld",38],["CMP0016","2025-09-29","S012","Healthcare professional","Missed visit","Moderate","Partially upheld",26],["CMP0017","2025-10-08","S009","Family member","Communication","High","Pending",null],["CMP0018","2025-10-08","S011","Family member","Missed visit","Moderate","Not upheld",25],["CMP0019","2025-10-12","S028","Client","Missed visit","High","Partially upheld",13],["CMP0020","2025-10-15","S026","Client","Continuity of carer","Moderate","Upheld",10],["CMP0021","2025-10-21","S007","Local Authority","Punctuality","Moderate","Partially upheld",24],["CMP0022","2025-10-28","S023","Family member","Continuity of carer","Low","Partially upheld",11],["CMP0023","2025-11-05","S011","Family member","Care quality","Moderate","Upheld",28],["CMP0024","2025-11-08","S006","Local Authority","Continuity of carer","Low","Partially upheld",10],["CMP0025","2025-11-14","S006","Family member","Conduct/attitude","Moderate","Not upheld",39],["CMP0026","2025-11-17","S019","Local Authority","Conduct/attitude","Moderate","Pending",null],["CMP0027","2025-11-19","S012","Family member","Missed visit","High","Upheld",10],["CMP0028","2025-11-20","S026","Local Authority","Communication","Moderate","Partially upheld",27],["CMP0029","2025-11-22","S026","Family member","Communication","Low","Upheld",7],["CMP0030","2025-12-15","S022","Family member","Missed visit","Low","Upheld",18],["CMP0031","2025-12-22","S025","Family member","Conduct/attitude","Moderate","Not upheld",12],["CMP0032","2025-12-26","S023","Healthcare professional","Punctuality","Low","Upheld",26],["CMP0033","2026-01-10","S012","Local Authority","Conduct/attitude","High","Not upheld",36],["CMP0034","2026-01-11","S024","Family member","Continuity of carer","High","Not upheld",15],["CMP0035","2026-01-17","S017","Local Authority","Care quality","Low","Upheld",39],["CMP0036","2026-01-22","S006","Family member","Continuity of carer","Moderate","Not upheld",9],["CMP0037","2026-02-04","S024","Local Authority","Care quality","Moderate","Not upheld",22],["CMP0038","2026-02-14","S022","Family member","Punctuality","Moderate","Pending",null],["CMP0039","2026-03-16","S011","Family member","Care quality","Low","Upheld",2],["CMP0040","2026-03-16","S017","Family member","Missed visit","Low","Partially upheld",34],["CMP0041","2026-03-23","S013","Family member","Continuity of carer","Low","Partially upheld",7],["CMP0042","2026-03-25","S008","Healthcare professional","Care quality","Moderate","Not upheld",17],["CMP0043","2026-03-26","S013","Client","Missed visit","Moderate","Upheld",2],["CMP0044","2026-03-29","S006","Family member","Missed visit","Low","Pending",null],["CMP0045","2026-03-30","S007","Local Authority","Care quality","Low","Partially upheld",37],["CMP0046","2026-04-01","S004","Family member","Care quality","High","Partially upheld",32],["CMP0047","2026-04-04","S013","Family member","Punctuality","Low","Not upheld",30],["CMP0048","2026-04-14","S023","Family member","Continuity of carer","Low","Not upheld",29],["CMP0049","2026-04-19","S028","Family member","Missed visit","Moderate","Upheld",15],["CMP0050","2026-04-19","S020","Local Authority","Care quality","Moderate","Not upheld",13],["CMP0051","2026-04-29","S008","Family member","Punctuality","Low","Upheld",6],["CMP0052","2026-05-02","S017","Healthcare professional","Conduct/attitude","Low","Not upheld",15],["CMP0053","2026-05-19","S001","Local Authority","Care quality","High","Not upheld",21],["CMP0054","2026-05-23","S012","Client","Communication","High","Partially upheld",8],["CMP0055","2026-06-14","S014","Client","Communication","Low","Pending",null]],"feedback":[["2025-07-01","S003",3,"Yes","Reliability"],["2025-07-02","S004",4,"Yes","Personal care quality"],["2025-07-02","S006",4,"Yes","Medication support"],["2025-07-05","S017",3,"No","Communication"],["2025-07-06","S022",5,"Yes","Communication"],["2025-07-07","S005",4,"Yes","Kindness and dignity"],["2025-07-08","S003",3,"Yes","Personal care quality"],["2025-07-08","S028",3,"Yes","Communication"],["2025-07-10","S012",3,"Yes","Timekeeping"],["2025-07-10","S017",4,"Yes","Communication"],["2025-07-10","S016",5,"Yes","Kindness and dignity"],["2025-07-12","S009",4,"Yes","Medication support"],["2025-07-12","S021",3,"Yes","Medication support"],["2025-07-12","S002",3,"Yes","Medication support"],["2025-07-13","S008",5,"Yes","Kindness and dignity"],["2025-07-16","S001",4,"Yes","Reliability"],["2025-07-18","S013",4,"Yes","Communication"],["2025-07-19","S026",4,"Yes","Timekeeping"],["2025-07-19","S028",3,"Yes","Personal care quality"],["2025-07-20","S006",3,"Yes","Timekeeping"],["2025-07-21","S007",4,"Yes","Reliability"],["2025-07-22","S013",4,"Yes","Timekeeping"],["2025-07-23","S015",4,"Yes","Personal care quality"],["2025-07-25","S008",4,"Yes","Personal care quality"],["2025-07-25","S013",4,"Yes","Kindness and dignity"],["2025-07-25","S022",3,"Yes","Timekeeping"],["2025-07-26","S017",5,"Yes","Timekeeping"],["2025-07-27","S012",3,"Yes","Personal care quality"],["2025-07-29","S024",4,"Yes","Personal care quality"],["2025-07-30","S007",4,"Yes","Personal care quality"],["2025-07-31","S010",4,"Yes","Kindness and dignity"],["2025-08-01","S015",5,"Yes","Kindness and dignity"],["2025-08-01","S021",4,"Yes","Reliability"],["2025-08-01","S021",2,"No","Personal care quality"],["2025-08-02","S024",3,"Yes","Timekeeping"],["2025-08-05","S023",5,"Yes","Timekeeping"],["2025-08-06","S013",4,"Yes","Reliability"],["2025-08-07","S006",3,"No","Personal care quality"],["2025-08-08","S019",3,"Yes","Personal care quality"],["2025-08-09","S020",4,"Yes","Medication support"],["2025-08-12","S021",4,"Yes","Kindness and dignity"],["2025-08-13","S026",4,"Yes","Timekeeping"],["2025-08-14","S028",3,"No","Communication"],["2025-08-14","S007",2,"No","Timekeeping"],["2025-08-15","S028",5,"Yes","Communication"],["2025-08-19","S017",3,"Yes","Personal care quality"],["2025-08-20","S019",4,"Yes","Reliability"],["2025-08-20","S017",3,"No","Communication"],["2025-08-22","S024",4,"Yes","Reliability"],["2025-08-22","S001",5,"Yes","Communication"],["2025-08-23","S016",3,"No","Timekeeping"],["2025-08-24","S003",2,"No","Reliability"],["2025-08-25","S006",4,"Yes","Medication support"],["2025-08-26","S028",2,"No","Reliability"],["2025-08-27","S018",4,"Yes","Kindness and dignity"],["2025-08-29","S012",4,"Yes","Kindness and dignity"],["2025-08-30","S026",3,"No","Timekeeping"],["2025-08-30","S014",4,"Yes","Personal care quality"],["2025-08-30","S003",3,"Yes","Kindness and dignity"],["2025-09-01","S025",3,"Yes","Communication"],["2025-09-01","S003",5,"Yes","Medication support"],["2025-09-01","S016",4,"Yes","Timekeeping"],["2025-09-02","S026",3,"Yes","Personal care quality"],["2025-09-02","S020",3,"Yes","Personal care quality"],["2025-09-03","S006",5,"Yes","Kindness and dignity"],["2025-09-04","S009",5,"Yes","Kindness and dignity"],["2025-09-05","S022",4,"Yes","Kindness and dignity"],["2025-09-06","S015",5,"Yes","Medication support"],["2025-09-10","S026",2,"No","Personal care quality"],["2025-09-11","S021",4,"Yes","Kindness and dignity"],["2025-09-11","S013",4,"Yes","Reliability"],["2025-09-12","S015",4,"Yes","Personal care quality"],["2025-09-13","S009",4,"Yes","Personal care quality"],["2025-09-15","S020",4,"Yes","Communication"],["2025-09-15","S015",4,"Yes","Communication"],["2025-09-17","S018",4,"Yes","Medication support"],["2025-09-21","S004",3,"No","Communication"],["2025-09-21","S010",2,"No","Kindness and dignity"],["2025-09-21","S016",3,"No","Kindness and dignity"],["2025-09-22","S018",4,"Yes","Timekeeping"],["2025-09-22","S015",4,"Yes","Kindness and dignity"],["2025-09-23","S008",4,"Yes","Timekeeping"],["2025-09-23","S015",5,"Yes","Reliability"],["2025-09-24","S001",5,"Yes","Timekeeping"],["2025-09-24","S020",4,"Yes","Timekeeping"],["2025-09-25","S027",5,"Yes","Kindness and dignity"],["2025-09-26","S005",4,"Yes","Reliability"],["2025-09-27","S001",3,"Yes","Timekeeping"],["2025-09-27","S019",4,"Yes","Reliability"],["2025-09-27","S010",4,"Yes","Medication support"],["2025-09-28","S012",3,"Yes","Medication support"],["2025-09-29","S021",4,"Yes","Personal care quality"],["2025-09-30","S013",5,"Yes","Reliability"],["2025-09-30","S009",4,"Yes","Medication support"],["2025-10-01","S017",3,"Yes","Personal care quality"],["2025-10-02","S028",4,"Yes","Medication support"],["2025-10-02","S025",4,"Yes","Kindness and dignity"],["2025-10-02","S003",4,"Yes","Personal care quality"],["2025-10-04","S020",4,"Yes","Timekeeping"],["2025-10-04","S027",4,"Yes","Reliability"],["2025-10-05","S020",3,"No","Kindness and dignity"],["2025-10-07","S013",5,"Yes","Medication support"],["2025-10-08","S028",4,"Yes","Timekeeping"],["2025-10-10","S027",4,"Yes","Kindness and dignity"],["2025-10-13","S013",3,"Yes","Reliability"],["2025-10-13","S003",4,"Yes","Medication support"],["2025-10-13","S010",4,"Yes","Reliability"],["2025-10-13","S019",4,"Yes","Communication"],["2025-10-13","S021",4,"Yes","Reliability"],["2025-10-14","S003",5,"Yes","Medication support"],["2025-10-15","S015",4,"Yes","Communication"],["2025-10-15","S014",5,"Yes","Communication"],["2025-10-16","S006",4,"Yes","Timekeeping"],["2025-10-16","S016",3,"No","Personal care quality"],["2025-10-18","S015",4,"Yes","Reliability"],["2025-10-19","S022",5,"Yes","Personal care quality"],["2025-10-19","S004",2,"No","Kindness and dignity"],["2025-10-21","S024",5,"Yes","Personal care quality"],["2025-10-22","S011",4,"Yes","Timekeeping"],["2025-10-22","S025",4,"Yes","Personal care quality"],["2025-10-23","S012",2,"No","Communication"],["2025-10-24","S002",5,"Yes","Communication"],["2025-10-24","S001",3,"No","Kindness and dignity"],["2025-10-25","S001",3,"Yes","Medication support"],["2025-10-26","S014",5,"Yes","Communication"],["2025-10-27","S023",4,"Yes","Timekeeping"],["2025-10-29","S026",2,"No","Personal care quality"],["2025-10-31","S001",3,"No","Timekeeping"],["2025-11-01","S017",4,"Yes","Reliability"],["2025-11-01","S008",4,"Yes","Kindness and dignity"],["2025-11-02","S023",5,"Yes","Kindness and dignity"],["2025-11-03","S005",5,"Yes","Medication support"],["2025-11-04","S016",2,"No","Kindness and dignity"],["2025-11-06","S028",4,"Yes","Communication"],["2025-11-06","S017",4,"Yes","Communication"],["2025-11-06","S021",4,"Yes","Reliability"],["2025-11-06","S006",4,"Yes","Communication"],["2025-11-06","S012",3,"No","Personal care quality"],["2025-11-06","S013",4,"Yes","Kindness and dignity"],["2025-11-07","S004",3,"No","Personal care quality"],["2025-11-09","S018",3,"Yes","Communication"],["2025-11-09","S016",4,"Yes","Reliability"],["2025-11-12","S010",4,"Yes","Medication support"],["2025-11-13","S002",3,"Yes","Kindness and dignity"],["2025-11-13","S025",3,"No","Reliability"],["2025-11-14","S003",4,"Yes","Kindness and dignity"],["2025-11-15","S018",5,"Yes","Personal care quality"],["2025-11-15","S001",3,"Yes","Personal care quality"],["2025-11-15","S002",4,"Yes","Timekeeping"],["2025-11-15","S003",4,"Yes","Kindness and dignity"],["2025-11-17","S005",4,"Yes","Communication"],["2025-11-17","S024",2,"No","Medication support"],["2025-11-19","S003",4,"Yes","Communication"],["2025-11-19","S012",2,"No","Timekeeping"],["2025-11-20","S024",4,"Yes","Reliability"],["2025-11-20","S018",4,"Yes","Kindness and dignity"],["2025-11-21","S016",3,"No","Reliability"],["2025-11-21","S027",5,"Yes","Kindness and dignity"],["2025-11-21","S018",5,"Yes","Personal care quality"],["2025-11-21","S013",4,"Yes","Communication"],["2025-11-22","S020",3,"Yes","Personal care quality"],["2025-11-22","S007",5,"Yes","Medication support"],["2025-11-23","S020",3,"No","Communication"],["2025-11-23","S003",3,"Yes","Personal care quality"],["2025-11-24","S001",4,"Yes","Reliability"],["2025-11-26","S018",4,"Yes","Communication"],["2025-11-27","S009",5,"Yes","Medication support"],["2025-11-28","S017",4,"Yes","Communication"],["2025-12-01","S013",4,"Yes","Communication"],["2025-12-01","S028",4,"Yes","Medication support"],["2025-12-02","S020",2,"No","Kindness and dignity"],["2025-12-04","S010",5,"Yes","Personal care quality"],["2025-12-06","S013",3,"Yes","Timekeeping"],["2025-12-07","S018",4,"Yes","Kindness and dignity"],["2025-12-07","S005",3,"No","Reliability"],["2025-12-10","S027",4,"Yes","Personal care quality"],["2025-12-10","S018",4,"Yes","Timekeeping"],["2025-12-11","S012",2,"No","Personal care quality"],["2025-12-12","S027",4,"Yes","Reliability"],["2025-12-13","S008",4,"Yes","Communication"],["2025-12-14","S021",4,"Yes","Timekeeping"],["2025-12-15","S016",3,"Yes","Timekeeping"],["2025-12-16","S015",4,"Yes","Reliability"],["2025-12-16","S028",4,"Yes","Medication support"],["2025-12-17","S024",3,"No","Reliability"],["2025-12-17","S014",5,"Yes","Timekeeping"],["2025-12-18","S015",5,"Yes","Medication support"],["2025-12-18","S028",3,"Yes","Kindness and dignity"],["2025-12-20","S017",4,"Yes","Communication"],["2025-12-20","S022",4,"Yes","Kindness and dignity"],["2025-12-21","S002",3,"No","Personal care quality"],["2025-12-21","S011",3,"Yes","Reliability"],["2025-12-25","S006",3,"No","Medication support"],["2025-12-27","S005",3,"No","Kindness and dignity"],["2025-12-27","S020",4,"Yes","Reliability"],["2025-12-27","S023",3,"Yes","Reliability"],["2025-12-28","S027",4,"Yes","Communication"],["2025-12-29","S021",3,"No","Reliability"],["2025-12-29","S002",4,"Yes","Communication"],["2025-12-29","S003",4,"Yes","Timekeeping"],["2025-12-29","S005",3,"Yes","Kindness and dignity"],["2025-12-29","S002",5,"Yes","Personal care quality"],["2025-12-30","S016",4,"Yes","Kindness and dignity"],["2025-12-30","S001",4,"Yes","Reliability"],["2026-01-02","S028",4,"Yes","Communication"],["2026-01-02","S024",5,"Yes","Kindness and dignity"],["2026-01-03","S001",3,"No","Reliability"],["2026-01-03","S001",3,"Yes","Reliability"],["2026-01-04","S028",4,"Yes","Kindness and dignity"],["2026-01-05","S002",4,"Yes","Kindness and dignity"],["2026-01-06","S015",4,"Yes","Kindness and dignity"],["2026-01-07","S019",4,"Yes","Medication support"],["2026-01-07","S008",5,"Yes","Medication support"],["2026-01-09","S004",3,"No","Timekeeping"],["2026-01-09","S028",5,"Yes","Kindness and dignity"],["2026-01-09","S013",4,"Yes","Kindness and dignity"],["2026-01-11","S003",4,"Yes","Kindness and dignity"],["2026-01-11","S009",5,"Yes","Personal care quality"],["2026-01-13","S010",4,"Yes","Communication"],["2026-01-13","S028",4,"Yes","Kindness and dignity"],["2026-01-15","S022",4,"Yes","Timekeeping"],["2026-01-15","S014",4,"Yes","Reliability"],["2026-01-15","S006",2,"No","Kindness and dignity"],["2026-01-15","S026",5,"Yes","Personal care quality"],["2026-01-17","S015",4,"Yes","Timekeeping"],["2026-01-17","S004",3,"No","Reliability"],["2026-01-17","S017",4,"Yes","Medication support"],["2026-01-20","S005",4,"Yes","Kindness and dignity"],["2026-01-20","S027",4,"Yes","Kindness and dignity"],["2026-01-20","S023",4,"Yes","Personal care quality"],["2026-01-21","S021",4,"Yes","Medication support"],["2026-01-21","S028",3,"No","Medication support"],["2026-01-22","S001",2,"No","Reliability"],["2026-01-22","S021",4,"Yes","Medication support"],["2026-01-23","S011",5,"Yes","Personal care quality"],["2026-01-23","S024",4,"Yes","Timekeeping"],["2026-01-23","S010",4,"Yes","Reliability"],["2026-01-24","S014",4,"Yes","Communication"],["2026-01-25","S008",4,"Yes","Medication support"],["2026-01-26","S001",3,"Yes","Kindness and dignity"],["2026-01-26","S004",3,"No","Timekeeping"],["2026-01-29","S002",3,"Yes","Personal care quality"],["2026-01-29","S027",4,"Yes","Communication"],["2026-01-29","S008",4,"Yes","Medication support"],["2026-01-30","S014",3,"No","Medication support"],["2026-01-30","S008",5,"Yes","Personal care quality"],["2026-01-31","S009",5,"Yes","Medication support"],["2026-02-04","S011",4,"Yes","Medication support"],["2026-02-05","S018",3,"Yes","Medication support"],["2026-02-06","S010",4,"Yes","Timekeeping"],["2026-02-07","S006",5,"Yes","Timekeeping"],["2026-02-10","S004",3,"No","Personal care quality"],["2026-02-10","S022",4,"Yes","Communication"],["2026-02-10","S021",3,"No","Kindness and dignity"],["2026-02-10","S014",4,"Yes","Personal care quality"],["2026-02-10","S010",5,"Yes","Personal care quality"],["2026-02-11","S005",4,"Yes","Timekeeping"],["2026-02-11","S014",4,"Yes","Timekeeping"],["2026-02-12","S016",4,"Yes","Reliability"],["2026-02-12","S017",4,"Yes","Communication"],["2026-02-14","S010",3,"No","Reliability"],["2026-02-16","S022",4,"Yes","Timekeeping"],["2026-02-16","S022",5,"Yes","Personal care quality"],["2026-02-18","S021",4,"Yes","Personal care quality"],["2026-02-19","S001",3,"No","Reliability"],["2026-02-19","S007",3,"No","Timekeeping"],["2026-02-20","S013",5,"Yes","Kindness and dignity"],["2026-02-20","S013",3,"No","Personal care quality"],["2026-02-20","S005",4,"Yes","Personal care quality"],["2026-02-24","S026",4,"Yes","Communication"],["2026-02-24","S015",4,"Yes","Communication"],["2026-02-25","S019",5,"Yes","Medication support"],["2026-02-26","S015",3,"No","Communication"],["2026-02-26","S019",4,"Yes","Reliability"],["2026-02-28","S002",5,"Yes","Personal care quality"],["2026-02-28","S011",4,"Yes","Timekeeping"],["2026-03-01","S005",5,"Yes","Kindness and dignity"],["2026-03-01","S009",3,"Yes","Personal care quality"],["2026-03-02","S019",4,"Yes","Communication"],["2026-03-03","S010",4,"Yes","Kindness and dignity"],["2026-03-03","S002",4,"Yes","Personal care quality"],["2026-03-05","S003",3,"Yes","Personal care quality"],["2026-03-05","S011",3,"Yes","Personal care quality"],["2026-03-07","S013",4,"Yes","Communication"],["2026-03-09","S013",3,"No","Medication support"],["2026-03-09","S015",5,"Yes","Reliability"],["2026-03-10","S021",4,"Yes","Communication"],["2026-03-10","S009",4,"Yes","Kindness and dignity"],["2026-03-11","S026",4,"Yes","Communication"],["2026-03-12","S007",4,"Yes","Timekeeping"],["2026-03-13","S004",2,"No","Medication support"],["2026-03-14","S027",5,"Yes","Communication"],["2026-03-15","S020",2,"No","Kindness and dignity"],["2026-03-16","S015",4,"Yes","Communication"],["2026-03-18","S019",5,"Yes","Personal care quality"],["2026-03-18","S023",4,"Yes","Communication"],["2026-03-19","S012",3,"No","Timekeeping"],["2026-03-19","S027",5,"Yes","Kindness and dignity"],["2026-03-21","S016",3,"No","Kindness and dignity"],["2026-03-23","S010",3,"Yes","Kindness and dignity"],["2026-03-24","S001",4,"Yes","Medication support"],["2026-03-24","S005",5,"Yes","Timekeeping"],["2026-03-25","S023",4,"Yes","Reliability"],["2026-03-27","S016",3,"No","Medication support"],["2026-03-27","S005",3,"No","Kindness and dignity"],["2026-03-28","S023",4,"Yes","Timekeeping"],["2026-03-29","S015",4,"Yes","Communication"],["2026-03-30","S007",4,"Yes","Personal care quality"],["2026-03-30","S008",3,"Yes","Communication"],["2026-04-01","S020",3,"No","Communication"],["2026-04-02","S003",3,"Yes","Communication"],["2026-04-03","S026",5,"Yes","Reliability"],["2026-04-04","S019",5,"Yes","Timekeeping"],["2026-04-05","S022",4,"Yes","Timekeeping"],["2026-04-07","S022",3,"No","Communication"],["2026-04-08","S012",2,"No","Communication"],["2026-04-09","S007",4,"Yes","Kindness and dignity"],["2026-04-09","S010",4,"Yes","Communication"],["2026-04-11","S027",4,"Yes","Reliability"],["2026-04-11","S006",3,"Yes","Medication support"],["2026-04-12","S002",3,"No","Personal care quality"],["2026-04-13","S027",3,"No","Reliability"],["2026-04-13","S007",4,"Yes","Reliability"],["2026-04-14","S016",3,"No","Kindness and dignity"],["2026-04-18","S020",3,"No","Medication support"],["2026-04-19","S001",3,"No","Reliability"],["2026-04-19","S004",5,"Yes","Personal care quality"],["2026-04-19","S005",4,"Yes","Medication support"],["2026-04-19","S018",3,"No","Kindness and dignity"],["2026-04-20","S021",3,"No","Kindness and dignity"],["2026-04-21","S011",4,"Yes","Personal care quality"],["2026-04-21","S023",5,"Yes","Kindness and dignity"],["2026-04-21","S023",4,"Yes","Reliability"],["2026-04-23","S027",3,"Yes","Reliability"],["2026-04-24","S026",3,"No","Personal care quality"],["2026-04-24","S012",2,"No","Medication support"],["2026-04-25","S022",3,"No","Personal care quality"],["2026-04-25","S006",5,"Yes","Communication"],["2026-04-26","S011",4,"Yes","Reliability"],["2026-04-26","S004",3,"No","Medication support"],["2026-04-27","S024",2,"No","Kindness and dignity"],["2026-04-27","S025",4,"Yes","Kindness and dignity"],["2026-04-28","S003",4,"Yes","Communication"],["2026-04-28","S008",4,"Yes","Timekeeping"],["2026-04-29","S008",4,"Yes","Personal care quality"],["2026-04-29","S007",3,"Yes","Communication"],["2026-04-29","S025",4,"Yes","Reliability"],["2026-04-30","S007",4,"Yes","Personal care quality"],["2026-05-01","S012",2,"No","Communication"],["2026-05-02","S005",5,"Yes","Personal care quality"],["2026-05-02","S009",4,"Yes","Communication"],["2026-05-02","S015",5,"Yes","Timekeeping"],["2026-05-03","S001",3,"Yes","Reliability"],["2026-05-05","S010",5,"Yes","Communication"],["2026-05-05","S009",2,"No","Timekeeping"],["2026-05-07","S023",5,"Yes","Communication"],["2026-05-08","S025",4,"Yes","Personal care quality"],["2026-05-08","S027",5,"Yes","Reliability"],["2026-05-09","S015",4,"Yes","Kindness and dignity"],["2026-05-10","S002",5,"Yes","Kindness and dignity"],["2026-05-11","S007",2,"No","Medication support"],["2026-05-11","S025",5,"Yes","Personal care quality"],["2026-05-12","S007",4,"Yes","Medication support"],["2026-05-13","S015",4,"Yes","Communication"],["2026-05-14","S008",4,"Yes","Communication"],["2026-05-15","S016",4,"Yes","Timekeeping"],["2026-05-15","S026",2,"No","Communication"],["2026-05-16","S028",5,"Yes","Kindness and dignity"],["2026-05-16","S010",3,"No","Medication support"],["2026-05-17","S024",4,"Yes","Timekeeping"],["2026-05-18","S007",3,"No","Personal care quality"],["2026-05-18","S004",3,"Yes","Timekeeping"],["2026-05-20","S021",2,"No","Communication"],["2026-05-20","S011",3,"No","Kindness and dignity"],["2026-05-21","S014",5,"Yes","Personal care quality"],["2026-05-22","S008",5,"Yes","Communication"],["2026-05-22","S028",4,"Yes","Reliability"],["2026-05-23","S015",5,"Yes","Personal care quality"],["2026-05-25","S004",3,"Yes","Reliability"],["2026-05-26","S011",4,"Yes","Communication"],["2026-05-26","S013",4,"Yes","Kindness and dignity"],["2026-05-28","S022",4,"Yes","Personal care quality"],["2026-05-28","S025",4,"Yes","Kindness and dignity"],["2026-05-29","S012",3,"No","Reliability"],["2026-05-29","S004",3,"Yes","Personal care quality"],["2026-05-30","S005",5,"Yes","Timekeeping"],["2026-05-30","S003",4,"Yes","Reliability"],["2026-05-30","S019",4,"Yes","Timekeeping"],["2026-05-30","S024",2,"No","Medication support"],["2026-05-30","S010",5,"Yes","Reliability"],["2026-06-02","S001",3,"No","Medication support"],["2026-06-02","S006",3,"Yes","Communication"],["2026-06-04","S001",5,"Yes","Reliability"],["2026-06-04","S013",3,"Yes","Reliability"],["2026-06-05","S025",4,"Yes","Timekeeping"],["2026-06-06","S026",3,"Yes","Communication"],["2026-06-07","S028",3,"No","Kindness and dignity"],["2026-06-07","S027",4,"Yes","Timekeeping"],["2026-06-08","S024",4,"Yes","Communication"],["2026-06-08","S016",4,"Yes","Reliability"],["2026-06-09","S015",3,"Yes","Personal care quality"],["2026-06-10","S021",3,"No","Timekeeping"],["2026-06-10","S018",4,"Yes","Timekeeping"],["2026-06-11","S002",4,"Yes","Medication support"],["2026-06-12","S012",2,"No","Kindness and dignity"],["2026-06-12","S018",5,"Yes","Kindness and dignity"],["2026-06-12","S006",3,"No","Kindness and dignity"],["2026-06-12","S013",4,"Yes","Communication"],["2026-06-15","S019",4,"Yes","Personal care quality"],["2026-06-16","S007",2,"No","Medication support"],["2026-06-17","S015",4,"Yes","Reliability"],["2026-06-20","S023",4,"Yes","Personal care quality"],["2026-06-20","S008",4,"Yes","Medication support"],["2026-06-26","S014",3,"No","Timekeeping"],["2026-06-28","S004",1,"No","Personal care quality"],["2026-06-28","S025",4,"Yes","Personal care quality"],["2026-06-28","S006",4,"Yes","Medication support"],["2026-06-28","S006",4,"Yes","Timekeeping"],["2026-06-29","S017",4,"Yes","Kindness and dignity"],["2026-06-29","S018",4,"Yes","Personal care quality"]]};

// tuple layouts
// staff:      [id, name, role, team, status]
// incidents:  [id, date, staffId, category, severity, within24h, cqc, status]
// complaints: [id, date, staffId, source, category, severity, outcome, resolutionDays|null]
// feedback:   [date, staffId, score, recommend, theme]

const C = {
  ink: "#12333A", petrol: "#0F5257", sage: "#5F9678", sageSoft: "#DCEAE2",
  amber: "#D9A441", red: "#BF4A36", mist: "#F3F6F5", line: "#DDE6E3",
  sub: "#5B7370", card: "#FFFFFF",
};
const SEV_COLORS = { Low: "#9CC3B2", Moderate: "#D9A441", High: "#BF4A36" };
const RAG_COLORS = { Green: "#5F9678", Amber: "#D9A441", Red: "#BF4A36" };

const MONTHS = (() => {
  const out = [];
  for (let y = 2025, m = 6; out.length < 12; m++) {
    if (m === 12) { m = 0; y++; }
    out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
  }
  return out;
})();
const mLabel = (k) => {
  const [y, m] = k.split("-");
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1] + " " + y.slice(2);
};

export default function AldanatQualityDashboard() {
  const [team, setTeam] = useState("All");
  const [period, setPeriod] = useState(12);
  const [selected, setSelected] = useState(null);

  const staffMap = useMemo(() => {
    const m = {};
    RAW.staff.forEach(([id, name, role, tm, status]) => (m[id] = { id, name, role, team: tm, status }));
    return m;
  }, []);

  const activeMonths = MONTHS.slice(12 - period);
  const inPeriod = (d) => activeMonths.includes(d.slice(0, 7));
  const inTeam = (sid) => team === "All" || staffMap[sid]?.team === team;

  const data = useMemo(() => {
    const inc = RAW.incidents.filter((r) => inPeriod(r[1]) && inTeam(r[2]));
    const comp = RAW.complaints.filter((r) => inPeriod(r[1]) && inTeam(r[2]));
    const fb = RAW.feedback.filter((r) => inPeriod(r[0]) && inTeam(r[1]));
    return { inc, comp, fb };
  }, [team, period]);

  // ── KPIs ──
  const k = useMemo(() => {
    const { inc, comp, fb } = data;
    const high = inc.filter((r) => r[4] === "High").length;
    const w24 = inc.length ? inc.filter((r) => r[5] === "Yes").length / inc.length : 0;
    const upheld = comp.filter((r) => ["Upheld", "Partially upheld"].includes(r[6])).length;
    const decided = comp.filter((r) => r[6] !== "Pending").length;
    const avgFb = fb.length ? fb.reduce((s, r) => s + r[2], 0) / fb.length : 0;
    const rec = fb.length ? fb.filter((r) => r[3] === "Yes").length / fb.length : 0;
    const open = inc.filter((r) => r[7] === "Open").length;
    const cqc = inc.filter((r) => r[6] === "Yes").length;
    return { inc: inc.length, high, w24, comp: comp.length, upheld, decided, avgFb, rec, open, cqc };
  }, [data]);

  // ── Monthly trend ──
  const trend = useMemo(() =>
    activeMonths.map((mk) => {
      const inc = data.inc.filter((r) => r[1].startsWith(mk)).length;
      const comp = data.comp.filter((r) => r[1].startsWith(mk)).length;
      const fbm = data.fb.filter((r) => r[0].startsWith(mk));
      const avg = fbm.length ? fbm.reduce((s, r) => s + r[2], 0) / fbm.length : null;
      return { m: mLabel(mk), Incidents: inc, Complaints: comp, Feedback: avg ? +avg.toFixed(2) : null };
    }), [data, period]);

  // ── Incidents by category / severity ──
  const byCat = useMemo(() => {
    const cats = {};
    data.inc.forEach((r) => {
      cats[r[3]] = cats[r[3]] || { cat: r[3], Low: 0, Moderate: 0, High: 0 };
      cats[r[3]][r[4]]++;
    });
    return Object.values(cats).sort((a, b) => (b.Low + b.Moderate + b.High) - (a.Low + a.Moderate + a.High));
  }, [data]);

  const bySource = useMemo(() => {
    const s = {};
    data.comp.forEach((r) => (s[r[3]] = (s[r[3]] || 0) + 1));
    return Object.entries(s).map(([name, value]) => ({ name, value }));
  }, [data]);

  const lowThemes = useMemo(() => {
    const t = {};
    data.fb.filter((r) => r[2] <= 2).forEach((r) => (t[r[4]] = (t[r[4]] || 0) + 1));
    return Object.entries(t).map(([theme, n]) => ({ theme, n })).sort((a, b) => b.n - a.n);
  }, [data]);

  // ── Staff risk board ──
  const board = useMemo(() => {
    const rows = RAW.staff
      .filter(([id, , , tm, status]) => status === "Active" && (team === "All" || tm === team))
      .map(([id, name, role, tm]) => {
        const inc = data.inc.filter((r) => r[2] === id);
        const high = inc.filter((r) => r[4] === "High").length;
        const up = data.comp.filter((r) => r[2] === id && ["Upheld", "Partially upheld"].includes(r[6])).length;
        const fbm = data.fb.filter((r) => r[1] === id);
        const low = fbm.filter((r) => r[2] <= 2).length;
        const avg = fbm.length ? fbm.reduce((s, r) => s + r[2], 0) / fbm.length : null;
        const risk = inc.length * 2 + high * 5 + up * 4 + low;
        const rag = risk >= 25 ? "Red" : risk >= 12 ? "Amber" : "Green";
        return { id, name, role, team: tm, inc: inc.length, high, up, low, avg, risk, rag };
      });
    return rows.sort((a, b) => b.risk - a.risk);
  }, [data, team]);

  const detail = useMemo(() => {
    if (!selected) return null;
    const s = board.find((b) => b.id === selected);
    if (!s) return null;
    const events = [
      ...data.inc.filter((r) => r[2] === selected).map((r) => ({ d: r[1], type: "Incident", label: `${r[3]} (${r[4]})`, sev: r[4] })),
      ...data.comp.filter((r) => r[2] === selected).map((r) => ({ d: r[1], type: "Complaint", label: `${r[4]} — ${r[6]}`, sev: r[5] })),
    ].sort((a, b) => b.d.localeCompare(a.d));
    const fbTrend = activeMonths.map((mk) => {
      const f = data.fb.filter((r) => r[1] === selected && r[0].startsWith(mk));
      return { m: mLabel(mk), score: f.length ? +(f.reduce((x, r) => x + r[2], 0) / f.length).toFixed(2) : null };
    });
    return { s, events, fbTrend };
  }, [selected, board, data, period]);

  const pill = (active) => ({
    padding: "6px 14px", borderRadius: 999, border: `1px solid ${active ? C.petrol : C.line}`,
    background: active ? C.petrol : "#fff", color: active ? "#fff" : C.ink,
    fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
  });

  const Card = ({ children, style }) => (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, ...style }}>{children}</div>
  );

  const KPI = ({ label, value, sub, tone }) => (
    <Card style={{ flex: 1, minWidth: 140, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.sub, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: tone || C.ink, fontFamily: "'Sora', sans-serif", lineHeight: 1.2, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{sub}</div>}
    </Card>
  );

  const H = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 10, fontFamily: "'Sora', sans-serif" }}>{children}</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.mist, color: C.ink, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: "0 0 40px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;600;700&display=swap');
        *{box-sizing:border-box} button:focus-visible{outline:2px solid ${C.petrol};outline-offset:2px}
        @media (prefers-reduced-motion: reduce){*{transition:none!important}}`}</style>

      {/* Header */}
      <div style={{ background: C.ink, color: "#fff", padding: "22px 28px 20px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 22 }}>
              Aldanat Care <span style={{ color: C.sage }}>·</span> Quality Performance
            </div>
            <div style={{ fontSize: 13, color: "#B8CBC7", marginTop: 4 }}>
              Incidents, complaints and client feedback · sample data, Jul 2025 to Jun 2026
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["All", "Colchester", "Clacton", "Harwich"].map((t) => (
              <button key={t} style={pill(team === t)} onClick={() => { setTeam(t); setSelected(null); }}>{t}</button>
            ))}
            <span style={{ width: 10 }} />
            {[3, 6, 12].map((p) => (
              <button key={p} style={pill(period === p)} onClick={() => setPeriod(p)}>{p}m</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 20px 0" }}>
        {/* KPI row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KPI label="Incidents" value={k.inc} sub={`${k.open} open · ${k.cqc} CQC notifiable`} />
          <KPI label="High severity" value={k.high} tone={k.high > 0 ? C.red : C.sage} />
          <KPI label="Reported in 24h" value={`${Math.round(k.w24 * 100)}%`} tone={k.w24 >= 0.95 ? C.sage : k.w24 >= 0.85 ? C.amber : C.red} sub="Target 95%" />
          <KPI label="Complaints" value={k.comp} sub={`${k.upheld} upheld or partial`} />
          <KPI label="Upheld rate" value={k.decided ? `${Math.round((k.upheld / k.decided) * 100)}%` : "–"} tone={k.decided && k.upheld / k.decided > 0.4 ? C.red : C.ink} sub="Of decided complaints" />
          <KPI label="Avg feedback" value={k.avgFb.toFixed(2)} tone={k.avgFb >= 4.2 ? C.sage : k.avgFb >= 3.5 ? C.amber : C.red} sub={`${Math.round(k.rec * 100)}% would recommend`} />
        </div>

        {/* Trend + feedback */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginTop: 12 }}>
          <Card>
            <H>Incidents and complaints by month</H>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={trend} margin={{ left: -18, right: 6, top: 4 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Incidents" fill={C.petrol} radius={[4, 4, 0, 0]} />
                <Line dataKey="Complaints" stroke={C.amber} strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <H>Average client feedback score (target 4.0)</H>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={trend} margin={{ left: -18, right: 6, top: 4 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
                <ReferenceLine y={4} stroke={C.red} strokeDasharray="4 4" />
                <Line dataKey="Feedback" stroke={C.sage} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Category / source / themes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginTop: 12 }}>
          <Card>
            <H>Incidents by category and severity</H>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={byCat} layout="vertical" margin={{ left: 40, right: 10 }}>
                <CartesianGrid stroke={C.line} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="cat" width={110} tick={{ fontSize: 11, fill: C.ink }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
                {["Low", "Moderate", "High"].map((s) => (
                  <Bar key={s} dataKey={s} stackId="a" fill={SEV_COLORS[s]} radius={s === "High" ? [0, 4, 4, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <H>Complaints by source</H>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
                  {bySource.map((e, i) => (
                    <Cell key={i} fill={[C.petrol, C.sage, C.amber, "#8FB6AC"][i % 4]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <H>What drives low scores (1 to 2)</H>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={lowThemes} layout="vertical" margin={{ left: 40, right: 10 }}>
                <CartesianGrid stroke={C.line} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="theme" width={120} tick={{ fontSize: 11, fill: C.ink }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12 }} />
                <Bar dataKey="n" fill={C.red} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Staff risk board */}
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <H>Staff quality risk board</H>
            <div style={{ fontSize: 12, color: C.sub }}>
              Risk score = incidents ×2 + high severity ×5 + upheld complaints ×4 + low feedback ×1 · select a carer for detail
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
            {board.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(selected === s.id ? null : s.id)}
                style={{
                  textAlign: "left", padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  border: `1.5px solid ${selected === s.id ? C.ink : RAG_COLORS[s.rag] + "55"}`,
                  background: selected === s.id ? C.ink : RAG_COLORS[s.rag] + "14",
                  color: selected === s.id ? "#fff" : C.ink, transition: "background .15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{s.name}</span>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: RAG_COLORS[s.rag], flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: 11, color: selected === s.id ? "#B8CBC7" : C.sub, marginTop: 2 }}>
                  {s.team} · risk {s.risk}
                </div>
              </button>
            ))}
          </div>

          {detail && (
            <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16 }}>{detail.s.name}</div>
                <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10 }}>{detail.s.role} · {detail.s.team} · <span style={{ color: RAG_COLORS[detail.s.rag], fontWeight: 700 }}>{detail.s.rag}</span> (risk {detail.s.risk})</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                  <span><b>{detail.s.inc}</b> incidents</span>
                  <span><b>{detail.s.high}</b> high severity</span>
                  <span><b>{detail.s.up}</b> upheld complaints</span>
                  <span><b>{detail.s.avg ? detail.s.avg.toFixed(2) : "–"}</b> avg feedback</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, margin: "14px 0 6px" }}>Feedback trend</div>
                <ResponsiveContainer width="100%" height={110}>
                  <ComposedChart data={detail.fbTrend} margin={{ left: -22, right: 6 }}>
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.sub }} tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: C.sub }} tickLine={false} axisLine={false} />
                    <ReferenceLine y={4} stroke={C.red} strokeDasharray="4 4" />
                    <Line dataKey="score" stroke={C.petrol} strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Event log ({detail.events.length})</div>
                <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${C.line}`, borderRadius: 8 }}>
                  {detail.events.length === 0 && (
                    <div style={{ padding: 12, fontSize: 12.5, color: C.sub }}>No incidents or complaints in this period. Nothing to review.</div>
                  )}
                  {detail.events.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", borderBottom: `1px solid ${C.line}`, fontSize: 12.5, alignItems: "center" }}>
                      <span style={{ color: C.sub, minWidth: 74 }}>{e.d}</span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: e.type === "Incident" ? C.sageSoft : "#F5E6C8",
                        color: e.type === "Incident" ? C.petrol : "#8A6A1F",
                      }}>{e.type}</span>
                      <span style={{ flex: 1 }}>{e.label}</span>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: SEV_COLORS[e.sev] || C.line }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 14, lineHeight: 1.5 }}>
          Interpretation note: counts are not normalised by visit volume in this sample, so high counts may reflect higher caseloads or a strong reporting culture rather than poorer care. Use the risk board to prioritise supervision conversations, not as an automated performance judgement. All data shown is synthetic.
        </div>
      </div>
    </div>
  );
}
