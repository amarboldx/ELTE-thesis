package Thesis.RMS.Application.DTO;

import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableStatus;
import lombok.Data;

import java.util.List;

@Data
public class TableDataDTO {
    private Long id;
    private int tableNumber;
    private OrderStatus orderStatus;
    private TableStatus tableStatus;
    private List<Long> orderIds;
    private Long assignedStaffId;
    private String shape;
    private int x;
    private int y;
    private Integer width;
    private Integer height;
    private Integer radius;
    private int floor;
}
