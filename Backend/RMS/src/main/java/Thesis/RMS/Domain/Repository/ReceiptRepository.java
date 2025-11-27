package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Model.Receipt;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReceiptRepository {
    Receipt save(Receipt receipt);
    Optional<Receipt> findById(Long id);
    List<Receipt> findAll();
    Optional<Receipt> findByOrderId(Long orderId);
    List<Receipt> findByStaffId(Long staffId);
    List<Receipt> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}
