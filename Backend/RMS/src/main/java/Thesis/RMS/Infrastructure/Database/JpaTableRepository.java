package Thesis.RMS.Infrastructure.Database;


import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableStatus;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.TableRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface JpaTableRepository extends JpaRepository<TableData, Long>, TableRepository {
    @Override
    @NonNull
    TableData save(@NonNull TableData tableData);


    @Override
    @NonNull
    Optional<TableData> findById(@NonNull Long tableId);

    @Override
    @NonNull
    Optional<TableData> findByTableNumber(@NonNull int tableNumber);

    @Override
    @NonNull
    @Query("SELECT t FROM TableData t WHERE t.assignedStaff.staffId = :staffId")
    Optional<TableData> findByStaffId(@NonNull Long staffId);

    @Override
    @NonNull
    List<TableData> findByTableStatus(@NonNull TableStatus tableStatus);

    @Override
    @NonNull
    List<TableData> findAll();

    @Override
    @NonNull
    List<TableData> findByOrderStatus(OrderStatus status);

    @Override
    @Modifying
    @Query("DELETE FROM TableData t WHERE t.id = :tableId")
    void deleteById(@NonNull Long tableId);

    @Override
    List<TableData> findByFloor(int floor);

}
