package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Enums.Allergen_List;
import Thesis.RMS.Domain.Model.Item;

import java.util.List;
import java.util.Optional;

public interface ItemRepository {
    Item save(Item item);
    Optional<Item> findById(Long id);
    List<Item> findAll();
    void deleteById(Long id);
    List<Item> findByName(String name);
    List<Item> findByAllergenLists(List<Allergen_List> allergenList);
    List<Item> findByAvailable(boolean available);
}
