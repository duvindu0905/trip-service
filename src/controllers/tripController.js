const axios = require('axios');
const Trip = require('../models/tripModel');  // Import the Trip model

// Create a new trip
const createTrip = async (req, res) => {
  const {
    tripId,
    tripNumber,
    tripDate,  // Expect only date (no time)
    bookingStatus,
    confirmedSeatsCount,
    availableSeatsCount,
    routeNumber,
    scheduleId,
    permitNumber
  } = req.body;

  // Validate required fields
  if (!routeNumber || !tripDate || !scheduleId || !permitNumber) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  // Normalize tripDate to remove time and ensure it's a valid date
  const normalizedTripDate = new Date(tripDate);
  if (isNaN(normalizedTripDate)) {
    return res.status(400).json({ message: 'Invalid trip date format' });
  }

  // Set the time to midnight (00:00:00) to ignore the time part
  normalizedTripDate.setHours(0, 0, 0, 0);

  try {
    // Check if the routeNumber, scheduleId, and permitNumber exist in their respective services
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
    if (routeResponse.status !== 200) {
      return res.status(404).json({ message: 'Invalid routeNumber' });
    }

    // Fetch schedule data from schedule-service using scheduleId
    const scheduleResponse = await axios.get(`${scheduleServiceUrl}/${scheduleId}`);
    if (scheduleResponse.status !== 200) {
      return res.status(404).json({ message: 'Invalid scheduleId' });
    }

    // Fetch permit data from permit-service using permitNumber
    const permitResponse = await axios.get(`${permitServiceUrl}/${permitNumber}`);
    if (permitResponse.status !== 200) {
      return res.status(404).json({ message: 'Invalid permitNumber' });
    }

    const routeData = routeResponse.data;
    const scheduleData = scheduleResponse.data;
    const permitData = permitResponse.data;

    // Create a new trip using the fetched data
    const newTrip = new Trip({
      tripId,
      tripNumber,
      tripDate: normalizedTripDate,  // Store the normalized tripDate (without time)
      bookingStatus,
      confirmedSeatsCount,
      availableSeatsCount,
      routeNumber,
      routeName: routeData.routeName,
      travelDistance: routeData.travelDistance,
      travelDuration: routeData.travelDuration,
      startLocation: routeData.startLocation, // From route service
      endLocation: routeData.endLocation,     // From route service
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
      tripDate: new Date(tripDate).setHours(0, 0, 0, 0),  // Normalize to the start of the day
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
      tripDate: new Date(tripDate).setHours(0, 0, 0, 0)  // Normalize to the start of the day
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
