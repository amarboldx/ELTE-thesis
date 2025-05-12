package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.OrderDTO;
import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableStatus;
import Thesis.RMS.Domain.Model.*;
import Thesis.RMS.Domain.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Iterator;
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
    private final UserRepository userRepository;


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

    public List<OrderDTO> getOrdersForCurrentStaff() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        Staff staff = staffRepository.findByUser(user).orElseThrow(() -> new RuntimeException("Staff not found"));

        List<Order> orders = orderRepository.findByStaffId(staff.getStaffId());
        return orders.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<OrderDTO> getOrdersByStatusForCurrentStaff(OrderStatus status) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getStaff() == null) {
            throw new IllegalStateException("Current user is not associated with staff");
        }

        List<Order> orders = orderRepository.findByStaffIdAndStatus(user.getStaff().getStaffId(), status);
        return orders.stream().map(this::convertToDTO).toList();
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

        tableData.setOrderStatus(order.getStatus());
        tableData.setTableStatus(TableStatus.OCCUPIED);
        tableData.getOrders().add(order);
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
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        Optional<Item> itemToRemove = order.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();

        if (!itemToRemove.isPresent()) {
            throw new IllegalArgumentException("Item not found in order");
        }

        order.setItems(new ArrayList<>(order.getItems()));
        order.getItems().remove(itemToRemove.get());
        orderRepository.save(order);
    }

    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }
}
