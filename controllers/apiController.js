const OfficialTravel = require('../models/OfficialTravel');
const TravelItinerary = require('../models/TravelItinerary');
const TravelDocument = require('../models/TravelDocument');
const TravelMember = require('../models/TravelMember');
const TravelExpense = require('../models/TravelExpense');
const TravelApproval = require('../models/TravelApproval');

// Pegawai API Endpoints
const getMyTravel = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findBySubmittedBy(req.session.userId);
    res.json({ success: true, data: travels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getMyExpenses = async (req, res, next) => {
  try {
    const expenses = await TravelExpense.findBySubmittedBy(req.session.employeeId || req.session.userId);
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getMyDocuments = async (req, res, next) => {
  try {
    const documents = await TravelDocument.findByUserId(req.session.userId);
    res.json({ success: true, data: documents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Pimpinan API Endpoints
const getTravel = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findAll();
    res.json({ success: true, data: travels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getTravelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const travel = await OfficialTravel.findById(id);
    if (!travel) {
      return res.status(404).json({ success: false, error: 'Travel request not found.' });
    }

    const itineraries = await TravelItinerary.findByTravelId(id);
    const documents = await TravelDocument.findByTravelId(id);
    const members = await TravelMember.findByTravelId(id);
    const expenses = await TravelExpense.findByTravelId(id);
    const approvals = await TravelApproval.findByTravelId(id);

    res.json({
      success: true,
      data: {
        travel,
        itineraries,
        documents,
        members,
        expenses,
        approvals
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const expenses = await TravelExpense.findAll();
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getReports = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findAll();
    const completedTravels = travels.filter(t => t.status === 'completed');
    res.json({ success: true, data: completedTravels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getMyTravel,
  getMyExpenses,
  getMyDocuments,
  getTravel,
  getTravelById,
  getExpenses,
  getReports
};
