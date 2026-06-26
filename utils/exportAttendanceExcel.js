const ExcelJS = require('exceljs');

async function exportAttendanceExcel(res, rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Event', key: 'event_title', width: 30 },
    { header: 'Nama Peserta', key: 'participant_name', width: 25 },
    { header: 'Email', key: 'participant_email', width: 30 },
    { header: 'Registration Number', key: 'registration_number', width: 25 },
    { header: 'Ticket Number', key: 'ticket_number', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Metode', key: 'attendance_method', width: 15 },
    { header: 'Check-in', key: 'checked_in_at', width: 25 },
    { header: 'Check-out', key: 'checked_out_at', width: 25 }
  ];

  rows.forEach((row, index) => {
    worksheet.addRow({
      no: index + 1,
      event_title: row.event_title,
      participant_name: row.participant_name,
      participant_email: row.participant_email,
      registration_number: row.registration_number,
      ticket_number: row.ticket_number,
      status: row.status,
      attendance_method: row.attendance_method,
      checked_in_at: row.checked_in_at,
      checked_out_at: row.checked_out_at || '-'
    });
  });

  worksheet.getRow(1).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename="attendance-report.xlsx"'
  );

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = exportAttendanceExcel;