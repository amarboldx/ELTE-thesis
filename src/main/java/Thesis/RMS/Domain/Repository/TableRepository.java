package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableStatus;
import Thesis.RMS.Domain.Model.TableData;

import java.util.List;
import java.util.Optional;

public interface TableRepository {
    TableData save(TableData table);
    Optional<TableData> findById(Long id);
    Optional<TableData> findByTableNumber(int tableNumber);
    Optional<TableData> findByStaffId(Long staffId);
    List<TableData> findByTableStatus(TableStatus tableStatus);
    List<TableData> findAll();
    List<TableData> findByOrderStatus(OrderStatus status);
    void deleteById(Long id);
    List<TableData> findByFloor(int floor);
}