package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Model.Order;
import Thesis.RMS.Domain.Repository.OrderRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface JpaOrderRepository extends JpaRepository<Order, Long>, OrderRepository {
    @Override
    @NonNull
    Order save(@NonNull Order order);

    @Override
    @NonNull
    List<Order> findAll();

    @Override
    @NonNull
    Optional<Order> findById(@NonNull Long id);

    @Override
    @NonNull
    @Query("SELECT o FROM Order o WHERE o.tableData.tableNumber = :tableNumber")
    List<Order> findByTableNumber(@NonNull int tableNumber);

    @Override
    @Modifying
    @Query("DELETE FROM Order o WHERE o.id = :id")
    void deleteById(@NonNull Long id);

    @Override
    @NonNull
    List<Order> findByStatus(@NonNull OrderStatus status);

    @Override
    @NonNull
    @Query("SELECT o FROM Order o WHERE o.staff.staffId = :staffId")
    List<Order> findByStaffId(@NonNull Long staffId);

    @Override
    @NonNull
    @Query("SELECT o FROM Order o WHERE o.staff.staffId = :staffId AND o.status = :status")
    List<Order> findByStaffIdAndStatus(@NonNull Long staffId, @NonNull OrderStatus status);

    @Override
    @NonNull
    @Query("SELECT o FROM Order o WHERE o.tableData.id = :tableDataId")
    List<Order> findByTableDataId(@NonNull Long tableDataId);


}
