package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Model.Receipt;
import Thesis.RMS.Domain.Repository.ReceiptRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface JpaReceiptRepository extends JpaRepository<Receipt, Long>, ReceiptRepository {
    @Override
    @NonNull
    Receipt save(@NonNull Receipt receipt);

    @Override
    @NonNull
    @Query("SELECT r FROM Receipt r ORDER BY r.issuedAt DESC")
    List<Receipt> findAll();

    @Override
    @NonNull
    Optional<Receipt> findById(@NonNull Long id);

    @Override
    @Query("SELECT r FROM Receipt r WHERE r.order.id = :orderId ORDER BY r.issuedAt DESC")
    Optional<Receipt> findByOrderId(Long orderId);

    @Override
    @Query("SELECT r FROM Receipt r WHERE r.order.staff.staffId = :staffId ORDER BY r.issuedAt DESC")
    List<Receipt> findByStaffId(Long staffId);

    @Override
    @Query("SELECT r FROM Receipt r WHERE r.issuedAt BETWEEN :start AND :end ORDER BY r.issuedAt DESC")
    List<Receipt> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
