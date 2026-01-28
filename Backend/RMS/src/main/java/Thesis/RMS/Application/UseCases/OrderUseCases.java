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

import java.time.LocalDateTime;
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
    private final ReceiptRepository receiptRepository;


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

    @Transactional
    public void deleteOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));

        TableData table = order.getTableData();

        // 1. Perform the deletion first
        orderRepository.deleteById(orderId);

        // 2. Check remaining orders for the same table
        if (table != null) {
            List<Order> remainingOrders = orderRepository.findByTableDataId(table.getId());

            // Check if all other orders are in a terminal state
            boolean allFinished = remainingOrders.stream()
                    .allMatch(o -> o.getStatus() == OrderStatus.COMPLETED
                            || o.getStatus() == OrderStatus.CANCELLED
                            || o.getStatus() == OrderStatus.PAID);

            // If no orders left or all finished, set table to AVAILABLE
            if (remainingOrders.isEmpty() || allFinished) {
                table.setTableStatus(TableStatus.AVAILABLE);
                tableDataRepository.save(table);
            }
        }
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

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("Cannot add items to a completed order.");
        }

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item with ID " + itemId + " not found."));

        order.getItems().add(item);
        orderRepository.save(order);
    }

    public OrderDTO updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));



        order.setStatus(status);
        orderRepository.save(order);

        TableData table = order.getTableData();

        if (status == OrderStatus.IN_PROGRESS || status == OrderStatus.PENDING) {
            table.setTableStatus(TableStatus.OCCUPIED);
            tableDataRepository.save(table);
        } else {
            List<Order> tableOrders = orderRepository.findByTableDataId(table.getId());

            boolean allComplete = tableOrders.stream()
                    .allMatch(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.CANCELLED || o.getStatus() == OrderStatus.PAID);

            if (allComplete) {
                table.setTableStatus(TableStatus.AVAILABLE);
                tableDataRepository.save(table);
            }
        }

        return convertToDTO(order); // Always return updated DTO
    }



    @Transactional
    public void removeItemFromOrder(Long orderId, Long itemId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Cannot remove items from a completed order.");
        }

        Optional<Item> itemToRemove = order.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst();

        if (itemToRemove.isEmpty()) {
            throw new IllegalArgumentException("Item not found in order");
        }

        order.setItems(new ArrayList<>(order.getItems()));
        order.getItems().remove(itemToRemove.get());

        orderRepository.save(order);
    }


    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID " + orderId + " not found."));

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        TableData table = order.getTableData();
        List<Order> tableOrders = orderRepository.findByTableDataId(table.getId());
        boolean allComplete = tableOrders.stream()
                .allMatch(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.CANCELLED);

        if (allComplete) {
            table.setTableStatus(TableStatus.AVAILABLE);
            tableDataRepository.save(table);
        }
    }


    @Transactional
    public void payOrder(Long orderId, double tipAmount) {
        if (tipAmount < 0) {
            throw new IllegalArgumentException("Tip amount cannot be negative.");
        }

        // 1. Load order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order with ID " + orderId + " not found."));

        // 2. Guard against invalid states
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot pay for a cancelled order.");
        }
        if (order.getStatus() == OrderStatus.PAID) {
            throw new IllegalStateException("Order is already paid.");
        }

        // 3. Calculate total from item prices
        double totalAmount = order.getItems().stream()
                .mapToDouble(Item::getPrice)
                .sum();

        if (totalAmount <= 0) {
            throw new IllegalStateException("Cannot pay for an order with zero total amount.");
        }

        // 4. Create and save receipt
        Receipt receipt = new Receipt();
        receipt.setOrder(order);
        receipt.setIssuedAt(LocalDateTime.now());
        receipt.setTotalAmount(totalAmount);
        receipt.setTipAmount(tipAmount);
        receipt.setFinalAmount(totalAmount + tipAmount);

        receiptRepository.save(receipt);

        // 5. Mark order as PAID
        order.setStatus(OrderStatus.PAID);
        orderRepository.save(order);

        // 6. Update table status and clear assigned staff
        TableData table = order.getTableData();
        List<Order> tableOrders = orderRepository.findByTableDataId(table.getId());

        boolean allDone = tableOrders.stream()
                .allMatch(o ->
                        o.getStatus() == OrderStatus.COMPLETED
                                || o.getStatus() == OrderStatus.CANCELLED
                                || o.getStatus() == OrderStatus.PAID);

        if (allDone) {
            table.setTableStatus(TableStatus.AVAILABLE);
            table.setAssignedStaff(null); // Clear the waiter assignment
            tableDataRepository.save(table);
        }
    }

}
