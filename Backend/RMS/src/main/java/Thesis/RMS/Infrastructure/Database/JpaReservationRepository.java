package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Enums.ReservationStatus;
import Thesis.RMS.Domain.Model.Reservation;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.ReservationRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JpaReservationRepository extends JpaRepository<Reservation, Long>, ReservationRepository {

    @Override
    @NonNull
    Reservation save(@NonNull Reservation reservation);

    @Override
    @NonNull
    List<Reservation> findAll();

    @Override
    @NonNull
    @Query("SELECT r FROM Reservation r WHERE r.status = ?1")
    List<Reservation> findByStatus(ReservationStatus status);

    @Override
    @NonNull
    Optional<Reservation> findById(@NonNull Long id);

    @Override
    @Query("SELECT r FROM Reservation r WHERE r.tableData.id = ?1")
    List<Reservation> findByTableId(Long tableId);

    @Override
    @Query("SELECT r FROM Reservation r WHERE r.startTime BETWEEN ?1 AND ?2")
    List<Reservation> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    @Override
    @Modifying
    @Query("DELETE FROM Reservation r WHERE r.id = ?1")
    void deleteById(@NonNull Long id);

    @Override
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
            "FROM Reservation r " +
            "WHERE r.tableData = :tableData " +
            "AND r.status <> 'CANCELLED' " +
            "AND ((r.startTime < :endTime AND r.endTime > :startTime))")
    boolean existsByTableDataAndTimeRange(
            TableData tableData,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

}
