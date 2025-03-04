package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Enums.Allergen_List;
import Thesis.RMS.Domain.Model.Item;
import Thesis.RMS.Domain.Repository.ItemRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface JpaItemRepository extends JpaRepository<Item, Long>, ItemRepository {
    @Override
    @NonNull
    Item save(@NonNull Item item);

    @Override
    @NonNull
    Optional<Item> findById(@NonNull Long id);

    @Override
    @NonNull
    List<Item> findAll();

    @Override
    void deleteById(@NonNull Long id);

    @Override
    List<Item> findByName(String name);


    @Override
    @Query("SELECT i FROM Item i JOIN i.allergenList a WHERE a IN :allergenList")
    List<Item> findByAllergenLists(List<Allergen_List> allergenList);

    @Override
    List<Item> findByAvailable(boolean available);
}
