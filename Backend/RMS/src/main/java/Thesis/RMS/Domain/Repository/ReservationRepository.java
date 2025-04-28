package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Enums.ReservationStatus;
import Thesis.RMS.Domain.Model.Reservation;
import Thesis.RMS.Domain.Model.TableData;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository {
    Reservation save(Reservation reservation);
    List<Reservation> findAll();
    Optional<Reservation> findById(Long id);
    List<Reservation> findByTableId(Long tableId);
    List<Reservation> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    void deleteById(Long id);
    List<Reservation> findByStatus(ReservationStatus status);
    boolean existsByTableDataAndTimeRange(
            TableData tableData,
            LocalDateTime startTime,
            LocalDateTime endTime
    );
}