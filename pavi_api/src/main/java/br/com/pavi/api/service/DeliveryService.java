package br.com.pavi.api.service;

import br.com.pavi.api.exception.ResourceNotFoundException;
import br.com.pavi.api.model.Delivery;
import br.com.pavi.api.model.Trip;
import br.com.pavi.api.repository.DeliveryRepository;
import br.com.pavi.api.repository.TripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DeliveryService {

    private final DeliveryRepository repository;
    private final TripRepository tripRepository;

    public DeliveryService(DeliveryRepository repository,
                           TripRepository tripRepository) {
        this.repository = repository;
        this.tripRepository = tripRepository;
    }

    public List<Delivery> findAll() {
        return repository.findAll();
    }

    public Delivery findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found: " + id));
    }

    public List<Delivery> findByTripId(Long tripId) {
        return repository.findByTripId(tripId);
    }

    public List<Delivery> findByStatus(String status) {
        return repository.findByDeliveryStatus(status);
    }

    public Delivery save(Delivery delivery) {
        resolveTrip(delivery);
        return repository.save(delivery);
    }

    public Delivery update(Long id, Delivery data) {
        Delivery existing = findById(id);
        applyUpdates(existing, data);
        updateTripIfPresent(existing, data);

        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void resolveTrip(Delivery delivery) {
        if (delivery.getTrip() == null || delivery.getTrip().getId() == null) {
            throw new IllegalArgumentException("trip.id is required");
        }
        Long tripId = delivery.getTrip().getId();
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found: " + tripId));
        delivery.setTrip(trip);
    }

    private void applyUpdates(Delivery existing, Delivery data) {
        existing.setDeliveryValue(data.getDeliveryValue());
        existing.setDeliveryStatus(data.getDeliveryStatus());
        existing.setDate(data.getDate());
        existing.setPaymentDate(data.getPaymentDate());
        existing.setDeadline(data.getDeadline());
        existing.setDeliveryType(data.getDeliveryType());
        existing.setBoarding(data.getBoarding());
        existing.setCte(data.getCte());
        existing.setComplementaryCte(data.getComplementaryCte());
        existing.setIcms(data.getIcms());
        existing.setComplementaryIcms(data.getComplementaryIcms());
        existing.setTollValue(data.getTollValue());
        existing.setTollStatus(data.getTollStatus());
        existing.setObservations(data.getObservations());
        existing.setComplementaryDelivery(data.getComplementaryDelivery());
    }

    private void updateTripIfPresent(Delivery existing, Delivery data) {
        if (data.getTrip() == null) {
            return;
        }

        existing.setTrip(data.getTrip());
        resolveTrip(existing);
    }
}
