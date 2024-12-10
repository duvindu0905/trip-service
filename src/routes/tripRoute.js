const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTripsByLocationAndDate,
  getTripsByScheduleAndDate,
  getTripById,
  updateBookingStatus,
  deleteTripById
} = require('../controllers/tripController');

// Route to create a new trip (POST)
router.post('/trips', createTrip);

// Route to get all trips by location and date (GET)
router.get('/trips/:startLocation/:endLocation/:tripDate', getTripsByLocationAndDate);

// Route to get all trips by scheduleId and tripDate (GET)
router.get('/trips/:scheduleId/:tripDate', getTripsByScheduleAndDate);

// Route to get a trip by tripId (GET)
router.get('/trips/:tripId', getTripById);

// Route to update booking status by tripId (PATCH)
router.patch('/trips/:tripId', updateBookingStatus);

// Route to delete a trip by tripId (DELETE)
router.delete('/trips/:tripId', deleteTripById);

module.exports = router;
