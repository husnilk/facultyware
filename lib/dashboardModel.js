const db = require("./db");

const getAdminSummary = async () => {
  const [totalPeserta] = await db.query(
    "SELECT COUNT(*) AS total FROM event_registrations"
  );
  const [totalHadir] = await db.query(
    "SELECT COUNT(*) AS total FROM event_registrations WHERE attendance_status = 'attended'"
  );
  const [totalSertifikat] = await db.query(
    "SELECT COUNT(*) AS total FROM event_registrations WHERE certificate_number IS NOT NULL AND certificate_number != ''"
  );
  const [totalLaporan] = await db.query(
    "SELECT COUNT(*) AS total FROM event_documents WHERE document_type = 'report'"
  );

  return {
    totalPeserta: totalPeserta[0].total,
    totalHadir: totalHadir[0].total,
    totalSertifikat: totalSertifikat[0].total,
    totalLaporan: totalLaporan[0].total,
  };
};

const getUserRoles = async (userId) => {
  return ["admin"];
};

module.exports = { getAdminSummary, getUserRoles };