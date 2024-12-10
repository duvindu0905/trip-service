const axios = require('axios');
const Trip = require('../models/tripModel');  // Import the Trip model

// Create a new trip
const createTrip = async (req, res) => {
  const {
    tripId,
    tripNumber,
    tripDate,
    bookingStatus,
    confirmedSeatsCount,
    availableSeatsCount,
    routeNumber,
    startLocation,
    endLocation,
    scheduleId,
    permitNumber
  } = req.body;

  // Validate required fields
  if (!startLocation || !endLocation || !routeNumber || !tripDate || !scheduleId || !permitNumber) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    const existingTrip = await Trip.findOne({ tripId });
    if (existingTrip) {
      return res.status(400).json({ message: `Trip with ID ${tripId} already exists` });
    }

    // Select the correct service URLs based on the environment
    const routeServiceUrl = process.env.NODE_ENV === 'production' 
      ? process.env.ROUTE_SERVICE_URL_PRODUCTION 
      : process.env.ROUTE_SERVICE_URL_LOCAL;

    const scheduleServiceUrl = process.env.NODE_ENV === 'production' 
      ? process.env.SCHEDULE_SERVICE_URL_PRODUCTION 
      : process.env.SCHEDULE_SERVICE_URL_LOCAL;

    const permitServiceUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PERMIT_SERVICE_URL_PRODUCTION 
      : process.env.PERMIT_SERVICE_URL_LOCAL;

    // Fetch route data from route-service using routeNumber
    const routeResponse = await axios.get(`${routeServiceUrl}/${routeNumber}`);
    const routeData = routeResponse.data;

    // Fetch schedule data from schedule-service using scheduleId
    const scheduleResponse = await axios.get(`${scheduleServiceUrl}/${scheduleId}`);
    const scheduleData = scheduleResponse.data;

    // Fetch permit data from permit-service using permitNumber
    const permitResponse = await axios.get(`${permitServiceUrl}/${permitNumber}`);
    const permitData = permitResponse.data;

    // Check if the fetched data is valid
    if (!routeData || !scheduleData || !permitData) {
      return res.status(400).json({ message: 'Route, Schedule, or Permit data not found' });
    }

    // Create a new trip using the fetched data
    const newTrip = new Trip({
      tripId,
      tripNumber,
      tripDate,
      bookingStatus,
      confirmedSeatsCount,
      availableSeatsCount,
      routeNumber,
      routeName: routeData.routeName,
      travelDistance: routeData.travelDistance,
      travelDuration: routeData.travelDuration,
      startLocation,
      endLocation,
      scheduleId,
      departureTime: scheduleData.departureTime,
      arrivalTime: scheduleData.arrivalTime,
      permitNumber,
      vehicleNumber: permitData.vehicleNumber, // From permit service
      busType: permitData.busType,  // From permit service
      pricePerSeat: permitData.pricePerSeat,  // From permit service
      music: permitData.music,  // From permit service
      ac: permitData.ac,  // From permit service
    });

    await newTrip.save();
    res.status(201).json({ message: 'Trip created successfully', trip: newTrip });
  } catch (error) {
    console.error('Error creating trip:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all trips by location and date with optional query parameters for music and ac
const getTripsByLocationAndDate = async (req, res) => {
  const { startLocation, endLocation, tripDate } = req.params;
  const { music, ac } = req.query;

  try {
    const trips = await Trip.find({
      startLocation,
      endLocation,
      tripDate: new Date(tripDate),
      music: music === 'true',
      ac: ac === 'true'
    }).select('-_id -__v');  // Exclude _id and __v

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all trips by scheduleId and tripDate
const getTripsByScheduleAndDate = async (req, res) => {
  const { scheduleId, tripDate } = req.params;

  try {
    const trips = await Trip.find({
      scheduleId,
      tripDate: new Date(tripDate)
    }).select('-_id -__v');  // Exclude _id and __v

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a trip by tripId
const getTripById = async (req, res) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findOne({ tripId }).select('-_id -__v');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  const { tripId } = req.params;
  const { bookingStatus } = req.body;

  try {
    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    trip.bookingStatus = bookingStatus;
    await trip.save();

    res.status(200).json({ message: 'Booking status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a trip by tripId
const deleteTripById = async (req, res) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findOneAndDelete({ tripId });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTrip,
  getTripsByLocationAndDate,
  getTripsByScheduleAndDate,
  getTripById,
  updateBookingStatus,
  deleteTripById
};
