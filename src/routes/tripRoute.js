const express = require('express');
const router = express.Router();
const {
  createTrip,
  getTripsByLocationAndDate,
  getTripsByScheduleAndDate,
  getTripById,
  updateBookingStatus,
  deleteTripById,
} = require('../controllers/tripController');

// Route to create a new trip
router.post('/trips', createTrip);

// Route to get trips by location (start and end) and date
router.get('/trips/location/:startLocation/:endLocation/:tripDate', getTripsByLocationAndDate);

// Route to get trips by scheduleId and tripDate
router.get('/trips/schedule/:scheduleId/:tripDate', getTripsByScheduleAndDate);

// Route to get a trip by tripId
router.get('/trips/:tripId', getTripById);

// Route to update booking status
router.patch('/trips/:tripId/booking-status', updateBookingStatus);

// Route to delete a trip by tripId
router.delete('/trips/:tripId', deleteTripById);

module.exports = router;

