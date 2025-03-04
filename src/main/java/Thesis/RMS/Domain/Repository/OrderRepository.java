package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Model.Order;

import java.util.List;
import java.util.Optional;

public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(Long id);
    List<Order> findByTableNumber(int tableNumber);
    void deleteById(Long id);
    List<Order> findAll();
    List<Order> findByStatus(OrderStatus status);
}
