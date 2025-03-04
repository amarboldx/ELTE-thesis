package Thesis.RMS.Application.DTO;

import Thesis.RMS.Domain.Enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    private Long tableDataId;
    private LocalDateTime date;
    private OrderStatus status;
    private String waiterId;
    private List<Long> itemIds;
}
