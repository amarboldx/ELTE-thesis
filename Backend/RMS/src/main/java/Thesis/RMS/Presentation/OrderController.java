package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.OrderDTO;
import Thesis.RMS.Application.UseCases.OrderUseCases;
import Thesis.RMS.Domain.Enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
@RestController
@RequestMapping("api/v1/order")
public class OrderController {
    private final OrderUseCases orderUseCases;

    @Transactional
    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        return ResponseEntity.ok(orderUseCases.getOrders());
    }

    @Transactional
    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderUseCases.getOrderById(id));
    }

    @Transactional
    @GetMapping("/table/{tableNumber}")
    public ResponseEntity<List<OrderDTO>> getOrdersByTableNumber(@PathVariable int tableNumber) {
        return ResponseEntity.ok(orderUseCases.getOrderByTableNumber(tableNumber));
    }

    @Transactional
    @GetMapping("/staff/current")
    public ResponseEntity<List<OrderDTO>> getOrdersByStaffId() {
        return ResponseEntity.ok(orderUseCases.getOrdersForCurrentStaff());
    }

    @Transactional
    @GetMapping("/staff/status/{status}")
    public ResponseEntity<List<OrderDTO>> getOrdersByStatusForCurrentStaff(@PathVariable String status) {
        OrderStatus orderStatus;
        try {
            orderStatus = OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        List<OrderDTO> orders = orderUseCases.getOrdersByStatusForCurrentStaff(orderStatus);
        return ResponseEntity.ok(orders);
    }


    @Transactional
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderDTO>> getOrdersByStatus(@PathVariable OrderStatus status) {
        return ResponseEntity.ok(orderUseCases.getOrdersByStatus(status));
    }
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@RequestBody OrderDTO orderDTO) {
        return ResponseEntity.ok(orderUseCases.createOrder(orderDTO));
    }
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderUseCases.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER') or hasRole('ROLE_CHEF')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        orderUseCases.updateOrderStatus(id, status);
        return ResponseEntity.ok().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    @PatchMapping("/{id}/add-item")
    public ResponseEntity<Void> addItemToOrder(@PathVariable Long id, @RequestParam Long itemId) {
        orderUseCases.addItemToList(id, itemId);
        return ResponseEntity.ok().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PatchMapping("/{id}/remove-item")
    public ResponseEntity<Void> removeItemFromOrder(@PathVariable Long id, @RequestParam Long itemId) {
        orderUseCases.removeItemFromOrder(id, itemId);
        return ResponseEntity.ok().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER') or hasRole('ROLE_CHEF')")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long id) {
        orderUseCases.cancelOrder(id);
        return ResponseEntity.ok().build();
    }
}
