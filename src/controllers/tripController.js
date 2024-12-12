const axios = require('axios');
const Trip = require('../models/tripModel'); // Import the Trip model

// Normalize tripDate to 'YYYY-MM-DD' format
const normalizeDate = (date) => {
  const normalizedDate = new Date(date);
  if (isNaN(normalizedDate)) {
    return null;
  }
  return normalizedDate.toISOString().split('T')[0]; // Extract only the date part
};

// Create a new trip
const createTrip = async (req, res) => {
  const {
    tripId,
    tripNumber,
    tripDate, // Expect only date (no time)
    bookingStatus,
    confirmedSeatsCount,
    availableSeatsCount,
    routeNumber,
    scheduleId,
    permitNumber,
  } = req.body;

  // Validate required fields
  if (!routeNumber || !tripDate || !scheduleId || !permitNumber) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  // Normalize tripDate
  const formattedTripDate = normalizeDate(tripDate);
  if (!formattedTripDate) {
    return res.status(400).json({ message: 'Invalid trip date format' });
  }

  try {
    const routeServiceUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.ROUTE_SERVICE_URL_PRODUCTION
        : process.env.ROUTE_SERVICE_URL_LOCAL;

    const scheduleServiceUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.SCHEDULE_SERVICE_URL_PRODUCTION
        : process.env.SCHEDULE_SERVICE_URL_LOCAL;

    const permitServiceUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.PERMIT_SERVICE_URL_PRODUCTION
        : process.env.PERMIT_SERVICE_URL_LOCAL;

    // Fetch route, schedule, and permit data
    const [routeResponse, scheduleResponse, permitResponse] = await Promise.all([
      axios.get(`${routeServiceUrl}/${routeNumber}`),
      axios.get(`${scheduleServiceUrl}/${scheduleId}`),
      axios.get(`${permitServiceUrl}/${permitNumber}`),
    ]);

    // Validate responses
    if (routeResponse.status !== 200) throw new Error('Invalid routeNumber');
    if (scheduleResponse.status !== 200) throw new Error('Invalid scheduleId');
    if (permitResponse.status !== 200) throw new Error('Invalid permitNumber');

    const routeData = routeResponse.data;
    const scheduleData = scheduleResponse.data;
    const permitData = permitResponse.data;

    // Create an array of available booking numbers
    const availableBookingNumbers = Array.from(
      { length: availableSeatsCount },
      (_, index) => index + 1
    );

    // Create an array of confirmed seat numbers
    const confirmedSeatNumbers = Array.from(
      { length: confirmedSeatsCount },
      (_, index) => index + 1
    );

    // Create a new trip using the fetched data
    const newTrip = new Trip({
      tripId,
      tripNumber,
      tripDate: formattedTripDate, // Use the formatted date
      bookingStatus,
      confirmedSeatsCount,
      availableSeatsCount,
      routeNumber,
      routeName: routeData.routeName,
      travelDistance: routeData.travelDistance,
      travelDuration: routeData.travelDuration,
      startLocation: routeData.startLocation, // From route service
      endLocation: routeData.endLocation, // From route service
      scheduleId,
      departureTime: scheduleData.departureTime,
      arrivalTime: scheduleData.arrivalTime,
      permitNumber,
      vehicleNumber: permitData.vehicleNumber, // From permit service
      busType: permitData.busType, // From permit service
      pricePerSeat: permitData.pricePerSeat, // From permit service
      music: permitData.music, // From permit service
      ac: permitData.ac, // From permit service
      availableBookingNumbers: availableBookingNumbers,
      confirmedSeatNumbers: confirmedSeatNumbers,
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

  const formattedTripDate = normalizeDate(tripDate);
  if (!formattedTripDate) {
    return res.status(400).json({ message: 'Invalid trip date format' });
  }

  try {
    const trips = await Trip.find({
      startLocation,
      endLocation,
      tripDate: formattedTripDate, // Filter trips by normalized date
      ...(music && { music: music === 'true' }),
      ...(ac && { ac: ac === 'true' }),
    }).select('-_id -__v'); // Exclude _id and __v

    // Add availableBookingNumbers and confirmedSeatNumbers to each trip
    const tripsWithSeatNumbers = trips.map((trip) => ({
      ...trip.toObject(),
      availableBookingNumbers: trip.availableBookingNumbers,
      confirmedSeatNumbers: trip.confirmedSeatNumbers,
    }));

    res.status(200).json(tripsWithSeatNumbers);
  } catch (error) {
    console.error('Error fetching trips by location and date:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all trips by scheduleId and tripDate
const getTripsByScheduleAndDate = async (req, res) => {
  const { scheduleId, tripDate } = req.params;

  const formattedTripDate = normalizeDate(tripDate);
  if (!formattedTripDate) {
    return res.status(400).json({ message: 'Invalid trip date format' });
  }

  try {
    const trips = await Trip.find({
      scheduleId,
      tripDate: formattedTripDate, // Filter trips by normalized date
    }).select('-_id -__v'); // Exclude _id and __v

    // Add availableBookingNumbers and confirmedSeatNumbers to each trip
    const tripsWithSeatNumbers = trips.map((trip) => ({
      ...trip.toObject(),
      availableBookingNumbers: trip.availableBookingNumbers,
      confirmedSeatNumbers: trip.confirmedSeatNumbers,
    }));

    res.status(200).json(tripsWithSeatNumbers);
  } catch (error) {
    console.error('Error fetching trips by scheduleId and date:', error.message);
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

    // Add availableBookingNumbers and confirmedSeatNumbers to the trip
    const tripWithSeatNumbers = {
      ...trip.toObject(),
      availableBookingNumbers: trip.availableBookingNumbers,
      confirmedSeatNumbers: trip.confirmedSeatNumbers,
    };

    res.status(200).json(tripWithSeatNumbers);
  } catch (error) {
    console.error('Error fetching trip by ID:', error.message);
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
    console.error('Error updating booking status:', error.message);
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
    console.error('Error deleting trip:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTrip,
  getTripsByLocationAndDate,
  getTripsByScheduleAndDate,
  getTripById,
  updateBookingStatus,
  deleteTripById,
};
