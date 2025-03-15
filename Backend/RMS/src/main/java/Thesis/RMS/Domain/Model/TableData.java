package Thesis.RMS.Domain.Model;


import Thesis.RMS.Domain.Enums.OrderStatus;
import Thesis.RMS.Domain.Enums.TableShape;
import Thesis.RMS.Domain.Enums.TableStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "table_data")
public class TableData {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, unique = true)
        private int tableNumber;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private OrderStatus orderStatus;

        @Enumerated(EnumType.STRING)
        @Column
        private TableStatus tableStatus;

        @OneToMany(mappedBy = "tableData", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<Order> orders;

        @OneToMany(mappedBy = "tableData", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<Reservation> reservations;

        @ManyToOne
        @JoinColumn(name = "staff_id", nullable = true)
        private Staff assignedStaff;

        //FOR FLOOR PLAN


        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private TableShape shape;

        @Column(nullable = false)
        private int x; // X-coordinate on the floor plan

        @Column(nullable = false)
        private int y; // Y-coordinate on the floor plan

        @Column
        private Integer width; // For rectangle tables

        @Column
        private Integer height; // For rectangle tables

        @Column
        private Integer radius; // For circular tables

        @Column(nullable = false)
        private int floor; // Floor number


}
