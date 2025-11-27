package Thesis.RMS.Application.UseCases;


import Thesis.RMS.Application.DTO.ReceiptDTO;
import Thesis.RMS.Domain.Model.Item;
import Thesis.RMS.Domain.Model.Order;
import Thesis.RMS.Domain.Model.Receipt;
import Thesis.RMS.Domain.Repository.OrderRepository;
import Thesis.RMS.Domain.Repository.ReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ReceiptUseCases {
    private final ReceiptRepository receiptRepository;
    private final OrderRepository orderRepository;

    private ReceiptDTO convertToDTO(Receipt receipt) {
        return new ReceiptDTO(
                receipt.getId(),
                receipt.getOrder().getId(),
                receipt.getIssuedAt(),
                receipt.getTotalAmount(),
                receipt.getTipAmount(),
                receipt.getFinalAmount()
        );
    }

    private Receipt convertToEntity(ReceiptDTO dto, Order order) {
        Receipt receipt = new Receipt();
        receipt.setId(dto.getId());
        receipt.setOrder(order);
        receipt.setIssuedAt(dto.getIssuedAt());
        receipt.setTotalAmount(dto.getTotalAmount());
        receipt.setTipAmount(dto.getTipAmount());
        receipt.setFinalAmount(dto.getFinalAmount());
        return receipt;
    }

    @Transactional
    public ReceiptDTO createReceiptForOrder(Long orderId, double tipAmount) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Order with ID " + orderId + " not found."
                ));

        double totalAmount = order.getItems().stream()
                .mapToDouble(Item::getPrice)
                .sum();

        double finalAmount = totalAmount + tipAmount;

        Receipt receipt = new Receipt();
        receipt.setOrder(order);
        receipt.setIssuedAt(LocalDateTime.now());
        receipt.setTotalAmount(totalAmount);
        receipt.setTipAmount(tipAmount);
        receipt.setFinalAmount(finalAmount);

        Receipt saved = receiptRepository.save(receipt);
        return convertToDTO(saved);
    }

    @Transactional
    public ReceiptDTO saveReceipt(ReceiptDTO dto) {

        Order order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        double totalAmount = order.getItems().stream()
                .mapToDouble(Item::getPrice)
                .sum();

        dto.setTotalAmount(totalAmount);

        if (dto.getIssuedAt() == null) {
            dto.setIssuedAt(LocalDateTime.now());
        }

        dto.setFinalAmount(totalAmount + dto.getTipAmount());

        Receipt saved = receiptRepository.save(convertToEntity(dto, order));
        return convertToDTO(saved);
    }

    public ReceiptDTO getReceiptById(Long id) {
        Receipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Receipt with ID " + id + " not found."));
        return convertToDTO(receipt);
    }

    public List<ReceiptDTO> getAllReceipts() {
        return receiptRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ReceiptDTO getReceiptByOrderId(Long orderId) {
        Receipt receipt = receiptRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Receipt for order ID " + orderId + " not found."
                ));
        return convertToDTO(receipt);
    }

    public List<ReceiptDTO> getReceiptsByStaffId(Long staffId) {
        return receiptRepository.findByStaffId(staffId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ReceiptDTO> getReceiptsIssuedBetween(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Start and end dates cannot be null.");
        }

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Start date cannot be after the end date.");
        }
        return receiptRepository.findByStartTimeBetween(start, end).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}
