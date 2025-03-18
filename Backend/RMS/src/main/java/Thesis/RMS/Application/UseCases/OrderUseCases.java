package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.OrderDTO;
import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Model.Item;
import Thesis.RMS.Domain.Model.Order;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.ItemRepository;
import Thesis.RMS.Domain.Repository.OrderRepository;
import Thesis.RMS.Domain.Repository.StaffRepository;
import Thesis.RMS.Domain.Repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class OrderUseCases {
    private final OrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final TableRepository tableDataRepository;
    private final StaffRepository staffRepository;


    private OrderDTO convertToDTO(Order order) {
        List<Long> itemIds = order.getItems().stream()
                .map(Item::getId)
                .collect(Collectors.toList());

        return new OrderDTO(
                order.getId(),
                order.getTableData().getId(),
                order.getDate(),
                order.getStatus(),
                order.getStaff() != null ? order.getStaff().getStaffId() : null,
                itemIds
        );
    }



    private Order convertToEntity(OrderDTO orderDTO) {
        TableData tableData = tableDataRepository.findById(orderDTO.getTableDataId())
                .orElseThrow(() -> new IllegalArgumentException("Table with ID " + orderDTO.getTableDataId() + " not found."));

        Staff staff = staffRepository.findById(orderDTO.getStaffId())
                .orElseThrow(() -> new IllegalArgumentException("Staff (Waiter) with ID " + orderDTO.getStaffId() + " not found."));

        List<Item> items = orderDTO.getItemIds().stream()
                .map(itemId -> itemRepository.findById(itemId)
                        .orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found.")))
                .collect(Collectors.toList());

        Order order = new Order();
        order.setTableData(tableData);
        order.setDate(orderDTO.getDate());
        order.setStatus(orderDTO.getStatus());
        order.setStaff(staff);
        order.setItems(items);

        return order;
    }


    public List<OrderDTO> getOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<OrderDTO> getOrderByTableNumber(int tableNumber) {
        return orderRepository.findByTableNumber(tableNumber).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));
        return convertToDTO(order);
    }

    public List<OrderDTO> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public void deleteOrder(Long orderId) {
        orderRepository.deleteById(orderId);
    }

    @Transactional
    public OrderDTO createOrder(OrderDTO orderDTO) {
        TableData tableData = tableDataRepository.findById(orderDTO.getTableDataId())
                .orElseThrow(() -> new RuntimeException("Table not found"));

        Staff staff = staffRepository.findById(orderDTO.getStaffId())
                .orElseThrow(() -> new RuntimeException("Staff (Waiter) not found"));

        List<Item> items = orderDTO.getItemIds().stream()
                .map(itemId -> itemRepository.findById(itemId)
                        .orElseThrow(() -> new RuntimeException("Item not found: " + itemId)))
                .collect(Collectors.toList());


        if (items.isEmpty()) {
            throw new RuntimeException("No valid items found for the order");
        }

        Order order = new Order();
        order.setTableData(tableData);
        order.setDate(orderDTO.getDate());
        order.setStatus(orderDTO.getStatus());
        order.setStaff(staff);
        order.setItems(items);

        order = orderRepository.save(order);

        tableData.setAssignedStaff(staff);
        tableDataRepository.save(tableData);

        return convertToDTO(order);
    }

    @Transactional
    public void addItemToList(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));

        order.getItems().add(itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found.")));

        orderRepository.save(order);
    }

    public void updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));
        order.setStatus(status);
        orderRepository.save(order);
    }

    @Transactional
    public void removeItemFromOrder(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));

        order.getItems().removeIf(item -> item.getId().equals(itemId));
        orderRepository.save(order);
    }

    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
